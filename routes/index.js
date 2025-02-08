const nodemailer = require('nodemailer');
const {MercadoPagoConfig, Payment} = require('mercadopago')
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
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

  if (!req.body.payer.email || !req.body.payer.identification.number) {
    return res.status(400).json({ error: 'Email e CPF são obrigatórios.' });
  }

  const body= { 
    transaction_amount: req.body.transaction_amount,
    description: req.body.description,
    payment_method_id: req.body.payment_method_id,
        payer: {
        email: req.body.payer.email,
        identification: {
          type: req.body.payer.identification.type,
          number: req.body.payer.identification.number
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

const transport = nodemailer.createTransport({
  host:'smtp.gmail.com',
  port: '587',
  secure: false,
  auth:{
    user: process.env.EMAILUSER,
    pass: process.env.EMAILPASS
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const htmlTemplatePath = path.join(__dirname, '../EmailTemplates/InternalEmailTemplate.html');
const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
router.post('/send-email', function(req, res, next) {
  const dynamicData = {
    name: req.body.Name,
    number: req.body.Number
  };
  
  let emailContent = htmlTemplate;
  emailContent = emailContent.replace('{{name}}', dynamicData.name);
  emailContent = emailContent.replace('{{phone}}', dynamicData.number);

  transport.sendMail({
    from: 'Forged Performance <forgedperformancebot@gmail.com>',
    to:'danilorodrigues@me.com',
    subject: 'Nova Venda! 💸',
    html: emailContent,
    text: `Nome: ${req.body.Name} Telefone: ${req.body.Number}`,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High'
    }
  })
  .then((result) => res.send(result))
  .catch((error) => {
    console.log("error")
    console.log(error)
    res.status(500).json({ error: 'Erro ao processar o email.' });
  });
});

const clientTemplatePath = path.join(__dirname, '../EmailTemplates/ClientEmailTemplate.html');
const clientTemplate = fs.readFileSync(clientTemplatePath, 'utf-8');
router.post('/send-client-email', function(req, res, next) {
  
  let emailContent = clientTemplate;
  emailContent = emailContent.replace('{{name}}', req.body.name);

  transport.sendMail({
    from: 'Forged Performance <forgedperformancebot@gmail.com>',
    to: req.body.email,
    subject: 'Seja Bem vindo a Forged Performance',
    html: emailContent,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-MSMail-Priority': 'High'
    }
  })
  .then((result) => res.send(result))
  .catch((error) => {
    console.log("error")
    console.log(error)
    res.status(500).json({ error: 'Erro ao processar o email.' });
  });
});

module.exports = router;