// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false, 
  stripeKey: 'pk_test_CaZWQS6fclpnNqjuWrwyLmKj', 
  stripePlans: [
    ['Starter', 5, 499, 'plan_CjjBFxx0KDxELq'], 
    ['Pro', 20, 999, 'plan_CjjDbGfYz3bVRN'], 
    ['Elite', 50, 1499, 'plan_CjjDTY0xSEgNzr']
  ], 
  appServerDomain: 'localhost:4200', 
  appVersion: '1.0.0', 
  firebase: {
    apiKey: "AIzaSyB1t4K4sCu2MsKD_YLC_bu7wBnmRgh1LG4",
    authDomain: "training-app-32da6.firebaseapp.com",
    databaseURL: "https://training-app-32da6.firebaseio.com",
    projectId: "training-app-32da6",
    storageBucket: "training-app-32da6.appspot.com",
    messagingSenderId: "876179848247"
  }
};
