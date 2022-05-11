"use strict";

const indy = require('indy-sdk');
var crypto = require("crypto");


async function getSteward() {
    const fromWallet = await indy.openWallet({ 'id': 'stewardWalletName' }, { 'key': 'steward_key' });
    let stewardDidInfo = {
        'seed': '000000000000000000000000Steward1'
    };

    let [stewardDid, stewardKey] = await indy.createAndStoreMyDid(fromWallet, stewardDidInfo);
    return [fromWallet, stewardDid, stewardKey]
}


async function createWallet(nombre, key) {
    try {
        await indy.createWallet({ 'id': nombre }, { 'key': key });
    } catch (error) {

    }
    const wallet = await indy.openWallet({ 'id': nombre }, { 'key': key });


    const [did, keyDid] = await indy.createAndStoreMyDid(wallet, {
        'seed': crypto.randomBytes(16).toString('hex')
    });

    return [wallet, did, keyDid]
}


async function createSchema(name, key) {
    const [wallet, did, privateKey,  poolHandle] = await createIssuer(name, key)

    let [jobCertificateSchemaId, jobCertificateSchema] =
        await indy.issuerCreateSchema(did, 'Job-Certificate', '0.2',
            ['first_name', 'last_name', 'salary', 'employee_status',
                'experience']);

    let schemaRequest = await indy.buildSchemaRequest(did, jobCertificateSchema);


    await indy.signAndSubmitRequest(poolHandle, wallet, did, schemaRequest)

    let getSchemaRequest = await indy.buildGetSchemaRequest(did, jobCertificateSchemaId);
    let getSchemaResponse = await indy.submitRequest(poolHandle, getSchemaRequest);
    const [, schema] = await indy.parseGetSchemaResponse(getSchemaResponse);

    let [credDefId, creDefJson] =
        await indy.issuerCreateAndStoreCredentialDef(wallet, did, schema,
            'TAG1', 'CL', '{"support_revocation": false}');

    let credDefRequest = await indy.buildCredDefRequest(did, creDefJson);
    await indy.signAndSubmitRequest(poolHandle, wallet, did, credDefRequest);
   
    console.log(wallet, did, privateKey,jobCertificateSchemaId, JSON.stringify(creDefJson) )
}

async function createIssuer(nombre, key) {
    let poolName = 'localcli';
    let poolHandle = await indy.openPoolLedger(poolName);

    const [newWallet, newDid, newKey] = await createWallet(nombre, key)
    const [stewardWallet, stewardDid, stewardKey] = await getSteward()


    let nymRequest = await indy.buildNymRequest(stewardDid, newDid, newKey, null, 'TRUST_ANCHOR');
    await indy.signAndSubmitRequest(poolHandle, stewardWallet, stewardDid, nymRequest);


    return [newWallet, newDid, newKey,  poolHandle]
}

// crear un wallet un did un schema y un cred def
createSchema("j12", "j2_key")
