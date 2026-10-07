const assert = require('node:assert/strict');

const apiBaseUrl = (process.env.API_BASE_URL || 'http://127.0.0.1:3000').replace(
  /\/$/,
  ''
);
const productsUrl = `${apiBaseUrl}/api/products`;
const product = {
  pid: `CI-${Date.now()}-${process.pid}`,
  pname: 'CI Product',
  price: 100,
  quantity: 5,
};

let productCreated = false;

async function request(url, options = {}, expectedStatus = 200) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  let body = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      assert.fail(`Response from ${url} is not valid JSON: ${responseText}`);
    }
  }

  assert.equal(
    response.status,
    expectedStatus,
    `${options.method || 'GET'} ${url} returned ${response.status}: ${responseText}`
  );

  return body;
}

async function check(name, test) {
  await test();
  console.log(`PASS: ${name}`);
}

async function cleanup() {
  if (!productCreated) return;

  try {
    await fetch(`${productsUrl}/${product.pid}`, { method: 'DELETE' });
  } catch (error) {
    console.error(`Could not clean up ${product.pid}: ${error.message}`);
  }
}

async function run() {
  console.log(`Running CI API tests against ${apiBaseUrl}`);

  await check('API and MongoDB are healthy', async () => {
    const body = await request(`${apiBaseUrl}/api/health`);
    assert.equal(body.status, 'healthy');
    assert.equal(body.services.api, 'healthy');
    assert.equal(body.services.mongodb, 'healthy');
  });

  await check('POST /api/products creates a product', async () => {
    const body = await request(
      productsUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      },
      201
    );

    productCreated = true;
    assert.equal(body.data.pid, product.pid);
    assert.equal(body.data.pname, product.pname);
  });

  await check('duplicate pid is rejected', async () => {
    const body = await request(
      productsUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      },
      409
    );

    assert.match(body.message, /already exists/);
  });

  await check('GET /api/products returns the created product', async () => {
    const body = await request(productsUrl);
    assert.ok(body.data.some(({ pid }) => pid === product.pid));
  });

  await check('GET /api/products/:pid returns one product', async () => {
    const body = await request(`${productsUrl}/${product.pid}`);
    assert.equal(body.data.pid, product.pid);
  });

  await check('PUT /api/products/:pid updates the product', async () => {
    const body = await request(`${productsUrl}/${product.pid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pname: 'Updated CI Product',
        price: 200,
        quantity: 10,
      }),
    });

    assert.equal(body.data.pname, 'Updated CI Product');
    assert.equal(body.data.price, 200);
    assert.equal(body.data.quantity, 10);
  });

  await check('invalid product data is rejected', async () => {
    const body = await request(
      productsUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pid: `${product.pid}-INVALID`,
          pname: 'Invalid Product',
          price: -1,
          quantity: 1.5,
        }),
      },
      400
    );

    assert.equal(body.message, 'Product data is invalid');
  });

  await check('DELETE /api/products/:pid deletes the product', async () => {
    const body = await request(
      `${productsUrl}/${product.pid}`,
      { method: 'DELETE' }
    );

    productCreated = false;
    assert.equal(body.data.pid, product.pid);
  });

  await check('deleted product returns 404', async () => {
    const body = await request(`${productsUrl}/${product.pid}`, {}, 404);
    assert.match(body.message, /was not found/);
  });

  console.log('All CI API tests passed.');
}

run().catch(async (error) => {
  console.error(`FAIL: ${error.message}`);
  await cleanup();
  process.exitCode = 1;
});
