import * as yup from 'yup';
import { 
  isValidEmail, 
  isValidPhone, 
  isValidPostalCode, 
  isValidProvince,
  isValidAddress,
  isValidCity,
  isValidName
} from './validation';

// Newsletter form schema
export const newsletterSchema = yup.object().shape({
  email: yup
    .string()
    .required('Adresse email requise')
    .test('is-valid-email', 'Adresse email invalide', isValidEmail)
});

// Unsubscribe form schema
export const unsubscribeSchema = yup.object().shape({
  email: yup
    .string()
    .required('Adresse email requise')
    .test('is-valid-email', 'Adresse email invalide', isValidEmail)
});

// Email confirmation schema
export const emailConfirmationSchema = yup.object().shape({
  billingEmail: yup
    .string()
    .required('Adresse email requise')
    .test('is-valid-email', 'Adresse email invalide', isValidEmail),
  billingConfirmEmail: yup
    .string()
    .required('Confirmation de l\'adresse email requise')
    .oneOf([yup.ref('billingEmail')], 'Les adresses courriels ne correspondent pas')
});

// Checkout form schema
export const checkoutSchema = yup.object().shape({
  // Delivery method options
  deliveryMethod: yup.string().oneOf(['shipping', 'pickup']).required(),
  
  // Billing information
  billingFirstName: yup
    .string()
    .required('Le prénom est requis')
    .test('is-valid-name', 'Prénom invalide', isValidName),
  
  billingLastName: yup
    .string()
    .required('Le nom est requis')
    .test('is-valid-name', 'Nom invalide', isValidName),
  
  billingEmail: yup
    .string()
    .required('Adresse email requise')
    .test('is-valid-email', 'Adresse email invalide', isValidEmail),
  
  billingConfirmEmail: yup
    .string()
    .required('Confirmation de l\'adresse email requise')
    .oneOf([yup.ref('billingEmail')], 'Les adresses courriels ne correspondent pas'),
  
  billingPhone: yup
    .string()
    .required('Le numéro de téléphone est requis')
    .test('is-valid-phone', 'Numéro de téléphone invalide', isValidPhone),
  
  // Conditionally required billing address fields
  billingAddress1: yup.string().when('deliveryMethod', {
    is: 'shipping',
    then: yup.string().required('L\'adresse est requise').test('is-valid-address', 'Adresse invalide', isValidAddress)
  }),
  
  billingCity: yup.string().when('deliveryMethod', {
    is: 'shipping',
    then: yup.string().required('La ville est requise').test('is-valid-city', 'Ville invalide', isValidCity)
  }),
  
  billingState: yup.string().when('deliveryMethod', {
    is: 'shipping',
    then: yup.string().required('La province est requise').test('is-valid-province', 'Province invalide', isValidProvince)
  }),
  
  billingPostcode: yup.string().when('deliveryMethod', {
    is: 'shipping',
    then: yup.string().required('Le code postal est requis').test('is-valid-postal-code', 'Code postal invalide', isValidPostalCode)
  }),
  
  billingCountry: yup.string().required('Le pays est requis'),
  
  // Shipping information (only used if deliveryMethod is 'shipping')
  shippingSameAsBilling: yup.boolean(),
  
  // Conditionally required shipping address fields
  shippingAddress1: yup.string().when(['deliveryMethod', 'shippingSameAsBilling'], {
    is: (deliveryMethod, shippingSameAsBilling) => deliveryMethod === 'shipping' && !shippingSameAsBilling,
    then: yup.string().required('L\'adresse de livraison est requise').test('is-valid-address', 'Adresse invalide', isValidAddress)
  }),
  
  shippingCity: yup.string().when(['deliveryMethod', 'shippingSameAsBilling'], {
    is: (deliveryMethod, shippingSameAsBilling) => deliveryMethod === 'shipping' && !shippingSameAsBilling,
    then: yup.string().required('La ville de livraison est requise').test('is-valid-city', 'Ville invalide', isValidCity)
  }),
  
  shippingState: yup.string().when(['deliveryMethod', 'shippingSameAsBilling'], {
    is: (deliveryMethod, shippingSameAsBilling) => deliveryMethod === 'shipping' && !shippingSameAsBilling,
    then: yup.string().required('La province de livraison est requise').test('is-valid-province', 'Province invalide', isValidProvince)
  }),
  
  shippingPostcode: yup.string().when(['deliveryMethod', 'shippingSameAsBilling'], {
    is: (deliveryMethod, shippingSameAsBilling) => deliveryMethod === 'shipping' && !shippingSameAsBilling,
    then: yup.string().required('Le code postal de livraison est requis').test('is-valid-postal-code', 'Code postal invalide', isValidPostalCode)
  }),
  
  shippingCountry: yup.string().when(['deliveryMethod', 'shippingSameAsBilling'], {
    is: (deliveryMethod, shippingSameAsBilling) => deliveryMethod === 'shipping' && !shippingSameAsBilling,
    then: yup.string().required('Le pays de livraison est requis')
  }),
  
  // Pickup location (required if deliveryMethod is 'pickup')
  selectedPickupLocation: yup.string().when('deliveryMethod', {
    is: 'pickup',
    then: yup.string().required('Veuillez sélectionner un point de chute')
  }),
});
