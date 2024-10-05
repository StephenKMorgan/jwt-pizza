import { test, expect } from 'playwright-test-coverage';
const name = 'Tester';
const initials = name.split(' ').map(word => word[0]).join('');
const email = 'test@test.com';
const password = 'Tester1';
const token = 'abcdef';
const franchiseName = 'TestFranchise';
const userDiner = { id: 3, name: name, email: email, roles: [{ role: 'diner' }] };
const userAdmin = { id: 3, name: name, email: email, roles: [{ role: 'admin' }] };

const order = {
    "dinerId": 5,
    "orders": [
      {
        "id": 99,
        "franchiseId": 360,
        "storeId": 225,
        "date": "2024-10-03T23:48:19.000Z",
        "items": [
          {
            "id": 99,
            "menuId": 387,
            "description": "Its a pizza.",
            "price": 0.00099
          }
        ]
      }
    ],
    "page": 1
  }

const franchiseAdmin =[
      {
        "id": 1,
        "name": franchiseName,
        "admins": [
          {
            "id": 1,
            "name": name,
            "email": email
          }
        ],
        "stores": []
      },
  ]
  

  const franchiseNormal = [
    {
        id: 1,
        name: franchiseName,
        admins: [
          {
            id: 1,
            name: name,
            email: email
          }
        ],
        stores: [
          { id: 4, name: 'Lehi', createdAt: '2023-01-01T00:00:00Z'  },
          { id: 5, name: 'Springville', createdAt: '2023-01-01T00:00:00Z'  },
          { id: 6, name: 'American Fork', createdAt: '2023-01-01T00:00:00Z'  },
        ]
      },
  ];

  const franchiseReq = 
  {
    "stores": [],
    "name": franchiseName,
    "admins": [
      {
        "email": email
      }
    ]
  }

async function handleAuthRoute(route, isAdmin = false) {
    let user = isAdmin ? userAdmin : userDiner;
    if (route.request().method() === 'PUT') {
        const loginReq = { email: email, password: password };
        const loginRes = { user: user, token: token };
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    } else if (route.request().method() === 'POST') {
        const loginReq = { name: name, email: email, password: password };
        const loginRes = { user: user, token: token };
        if (route.request().postDataJSON().email !== email) {
            const errorRes = { message: 'email does not match' };
            await route.fulfill({
                status: 401,
                json: errorRes
            });
            return;
        }
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    } else if (route.request().method() === 'DELETE') {
        const logoutRes = { message: 'logout successful' };
        await route.fulfill({ json: logoutRes });
    }
}

async function handleFranchiseRoute(route, isAdmin = false) {
    let franchise = isAdmin ? franchiseAdmin : franchiseNormal;
    if (route.request().method() === 'GET') {
        const loginRes = franchise;
        await route.fulfill({ json: loginRes });
    } else if (route.request().method() === 'POST') {
        const loginReq = franchiseReq;
        const loginRes = franchise;
        expect(route.request().postDataJSON()).toMatchObject(loginReq);
        await route.fulfill({ json: loginRes });
    }
}

async function handleFranchiseDeleteRoute(route) {
    if (route.request().method() === 'DELETE') {
        const loginRes = { message: 'franchise deleted' };
        await route.fulfill({ json: loginRes });
    }
}

async function handleOrderRoute(route) {
    if (route.request().method() === 'GET') {
        const loginRes = order;
        await route.fulfill({ json: loginRes });
    } else if (route.request().method() === 'POST') {
        const orderReq = {
            items: [
              { menuId: 1, description: 'Veggie', price: 0.0038 },
              { menuId: 2, description: 'Pepperoni', price: 0.0042 },
            ],
            storeId: '4',
            franchiseId: 1,
          };
          const orderRes = {
            order: {
              items: [
                { menuId: 1, description: 'Veggie', price: 0.0038 },
                { menuId: 2, description: 'Pepperoni', price: 0.0042 },
              ],
              storeId: '4',
              franchiseId: 1,
              id: 23,
            },
            jwt: 'eyJpYXQ',
          };
          expect(route.request().method()).toBe('POST');
          expect(route.request().postDataJSON()).toMatchObject(orderReq);
          await route.fulfill({ json: orderRes });
    }
}

async function handleOrderRouteFail(route) {
  if (route.request().method() === 'GET') {
      const loginRes = order;
      await route.fulfill({ json: loginRes });
  } else if (route.request().method() === 'POST') {
      const orderReq = {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 1,
        };
        const errorRes = { message: 'Test fail' };
        await route.fulfill({
            status: 401,
            json: errorRes
        });
  }
}

async function handleMenuRoute(route) {
    const menuRes = [
        { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
        { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
}


test('home page and info', async ({ page }) => {
    await page.goto('/');
    expect(await page.title()).toBe('JWT Pizza');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
    await expect(page.getByRole('main')).toContainText('So you want a piece of the pie?');
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('main')).toContainText('The secret sauce');
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByRole('heading')).toContainText('Mama Rucci, my my');
});

test('purchase with login', async ({ page }) => {
    await page.route('**/api/order/menu', handleMenuRoute);
    await page.route('*/**/api/franchise', (route) => handleFranchiseRoute(route, false));
    await page.route('**/api/auth', (route) => handleAuthRoute(route, false));
    await page.route('**/api/order', handleOrderRoute);
    await page.goto('/');
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByText('0.008')).toBeVisible();
  });

  test('purchase with login fails', async ({ page }) => {
    await page.route('**/api/order/menu', handleMenuRoute);
    await page.route('*/**/api/franchise', (route) => handleFranchiseRoute(route, false));
    await page.route('**/api/auth', (route) => handleAuthRoute(route, false));
    await page.route('**/api/order', handleOrderRouteFail);
    await page.goto('/');
  
    // Go to order page
    await page.getByRole('button', { name: 'Order now' }).click();
  
    // Create order
    await expect(page.locator('h2')).toContainText('Awesome is a click away');
    await page.getByRole('combobox').selectOption('4');
    await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
    await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
    await expect(page.locator('form')).toContainText('Selected pizzas: 2');
    await page.getByRole('button', { name: 'Checkout' }).click();
  
    // Login
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
  
    // Pay
    await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
    await expect(page.locator('tbody')).toContainText('Veggie');
    await expect(page.locator('tbody')).toContainText('Pepperoni');
    await expect(page.locator('tfoot')).toContainText('0.008 ₿');
    await page.getByRole('button', { name: 'Pay now' }).click();
  
    // Check balance
    await expect(page.getByRole('main')).toContainText('⚠️ Test fail');
  });

test('login and logout', async ({ page }) => {
    await page.route('**/api/auth', (route) => handleAuthRoute(route, false));
    await page.goto('/');

    // Login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    //Verify login
    await expect(page.getByLabel('Global')).toContainText(initials);
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

    // Logout
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('register correctly', async ({ page }) => {
    await page.route('**/api/auth', (route) => handleAuthRoute(route, false));
    await page.route('**/api/order', handleOrderRoute);

    await page.goto('/');
    await page.getByRole('link', { name: 'Register', exact: true }).click();
    await page.getByRole('main').getByText('Login').click();
    await page.getByRole('main').getByText('Register').click();
    await page.getByPlaceholder('Full name').click();
    await page.getByPlaceholder('Full name').fill(name);
    await page.getByPlaceholder('Full name').press('Tab');
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByLabel('Global')).toContainText(initials);
    await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    await page.getByRole('link', { name: 'T', exact: true }).click();
    await expect(page.getByRole('main')).toContainText(name);
    await expect(page.getByRole('main')).toContainText('diner');
});

test('register with error', async ({ page }) => {
    await page.route('**/api/auth', (route) => handleAuthRoute(route, false));

    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByPlaceholder('Full name').fill(name);
    await page.getByPlaceholder('Email address').click();
    await page.getByPlaceholder('Email address').fill(email+'a');
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill('');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('main')).toContainText('{"code":401,"message":"email does not match"}');
});

test('admin panel', async ({ page }) => {

    // Mock the auth route
    await page.route('**/api/auth', (route) => handleAuthRoute(route, true));
    await page.route('**/api/franchise', (route) => handleFranchiseRoute(route, true));
    await page.route('**/api/franchise/*', (route) => handleFranchiseDeleteRoute(route));

    await page.goto('/');

    // Login
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').fill(email);
    await page.getByPlaceholder('Email address').press('Tab');
    await page.getByPlaceholder('Password').fill(password);
    await page.getByPlaceholder('Password').press('Enter');

    // Go to admin panel
    await page.getByRole('link', { name: 'Admin' }).click();

    // Add franchise
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByPlaceholder('franchise name').click();
    await page.getByPlaceholder('franchise name').fill(franchiseName);
    await page.getByPlaceholder('franchisee admin email').click();
    await page.getByPlaceholder('franchisee admin email').fill(email);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
    await expect(page.getByRole('main')).toContainText('TestFranchise');
    await page.getByRole('button', { name: 'Close' }).click();await expect(page.getByRole('heading')).toContainText('Mama Ricci\'s kitchen');
   
});

