export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  endpoints: {
    auth: {
      base: '/api/auth',
      signin: '/signin',
    },
    products: {
      base: '/api/products',
      getAll: '',
      getById: '/',
      create: '',
      update: '/',
      delete: '/'
    },
    paymentMethods: {
      base: '/api/payment-methods',
      getAll: '',
      getById: '/',
      create: '',
      update: '/',
      delete: '/'
    },
    orders: {
      base: '/api/orders',
      getAll: '',
      getById: '/',
      getByClient: '/client/',
      create: '',
      update: '/{id}',
      delete: '/',
      dailyCash: '/daily-cash',
      commissions: '/commissions'
    },
    clients: {
      base: '/api/clients',
      getAll: '',
      getById: '/',
      create: '',
      update: '/{id}',
      delete: '/{id}'
    },
    users: {
      base: '/api/auth',
      getAll: '/users',
      create:'/signup',
      update: '/users/{id}',
      delete: '/users/{id}'
    }
  }
};
  