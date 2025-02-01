const {MercadoPagoConfig, Payment} = require('mercadopago')
const crypto = require('crypto');
require('dotenv').config();

const client = new MercadoPagoConfig({ 
  accessToken: process.env.ACCESS_TOKEN, 
  options: { 
    timeout: 5000, 
    idempotencyKey: crypto.randomBytes(16).toString('hex')
  }});

const payment = new Payment(client);

var express = require('express');
var router = express.Router();

router.post('/create-pix', function(req, res, next) {
  console.log("Request")
  console.log(req.body)

  if (!req.body.email || !req.body.number) {
    return res.status(400).json({ error: 'Email e CPF são obrigatórios.' });
  }

  const body= { 
    transaction_amount: req.body.transaction_amount,
    description: req.body.description,
    payment_method_id: req.body.paymentMethodId,
        payer: {
        email: req.body.email,
        identification: {
          type: req.body.identificationType,
          number: req.body.number
    }}}

  const requestOptions= { idempotencyKey: crypto.randomBytes(16).toString('hex') }

  payment.create({ body, requestOptions })
  .then((result) => {
    console.log("result")
    console.log(result)
    res.send(result);
  })
  .catch((error) => {
    console.log("error")
    console.log(error)
    res.status(500).json({ error: 'Erro ao processar o pagamento.' });
  });
});

module.exports = router;
