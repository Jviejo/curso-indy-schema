const indy = require('indy-sdk');
var crypto = require("crypto");
const express = require('express');
const jwt = require('jsonwebtoken');
const { send } = require('process');
const res = require('express/lib/response');

const app = express();
app.use(express.json());

// api/v1/wallet/create
app.post('/api/wallet/create', async (req, res) => {
    const { name, key } = req.body;
    try {
        await indy.createWallet({ 'id': name }, { 'key': key });
    } catch (error) {
        res.status(500).send({ error })
        return
    }
    const wallet = await indy.openWallet({ 'id': name }, { 'key': key });


    const [did, keyDid] = await indy.createAndStoreMyDid(wallet, {
        'seed': crypto.randomBytes(16).toString('hex')
    });

    res.send({ did, keyDid });
})

app.post('/api/wallet/open', async (req, res) => {
    const { name, key } = req.body;
    try {
        const wallet = await indy.openWallet({ 'id': name }, { 'key': key });
    } catch (error) {
        res.status(500).send({ error })
    }
    res.send(req.body);
})

app.post('/api/wallet/packmessage', async (req, res) => {
    const { name, key, message, receiverKeys, senderKey } = req.body;
    console.log(req.body)
    const wallet = await indy.openWallet({ 'id': name }, { 'key': key });
    const packet = await indy.packMessage(
        wallet, Buffer.from(JSON.stringify(message)), receiverKeys, senderKey
    )
    const json = JSON.parse(packet.toString("utf8"))
    require("fs").writeFileSync("./packet.json", JSON.stringify(json, null, 2))
    res.send(json);
})

app.post('/api/wallet/unpackmessage', async (req, res) => {
    const { name, key, message } = req.body;
    console.log(req.body)
    const wallet = await indy.openWallet({ 'id': name }, { 'key': key });
    console.log(JSON.stringify(message))
    const response = await indy.unpackMessage(wallet, Buffer.from(JSON.stringify(message)))

    res.send(response);
})

app.post('/api/issuer/CreateSchema', async (req, res) => {
    const { issuerDid, name, version, attrNames } = req.body;
    const [id, schema] = await indy.issuerCreateSchema(issuerDid, name, version, attrNames)
    res.send({ id, schema });
})


app.post("/api/issuer/CreateAndStoreCredentialDef", async (req, res) => {
    const { name, key, issuerDid, schema, tag, signatureType, config } = req.body;
    const wallet = await indy.openWallet({ 'id': name }, { 'key': key });
    const [credDefId, credDef] = await indy.issuerCreateAndStoreCredentialDef(
        wallet, issuerDid, schema.schema, tag, signatureType, config
    )
    require("fs").writeFileSync("./creddef.json", JSON.stringify(credDef, null, 2))
    res.send({ credDefId, credDef });
})



app.listen(3000, () => {
    console.log('Server running on port 3000');
})