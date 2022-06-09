"use strict";

const indy = require('indy-sdk');
var crypto = require("crypto");
const indyBinding = require('indy-sdk/src/indyBinding');

indy.setLogger(function (level, target, message, modulePath, file, line) {
    console.log('libindy said:', level, target, message, modulePath, file, line)
})

async function testPack() {
    let poolName = 'localcli';
    let poolHandle = await indy.openPoolLedger(poolName);

    const fromWallet = await indy.openWallet({ 'id': 'stewardWalletName' }, { 'key': 'steward_key' });
    let senderKey = await indy.keyForDid(poolHandle, fromWallet, 'Th7MpTaRZVRYnPiabds81Y');
    let retrievedVerkey1 = await indy.keyForDid(poolHandle, fromWallet, '29YVyTgWRYh1pnnGugfySq');
    let retrievedVerkey2 = await indy.keyForDid(poolHandle, fromWallet, 'FEW11JWtZHiQEVY7iQVP6X');
    console.log(retrievedVerkey1, senderKey);
    const packed = await indy.packMessage(fromWallet , Buffer.from('{"test": "test"}'), [retrievedVerkey1,retrievedVerkey2], senderKey);
    console.log(packed.toString());
    //const unpacked = await indy.unpackMessage(fromWallet, packed);

    //console.log(unpacked);
    const full = await indy.getMyDidWithMeta(fromWallet, 'Th7MpTaRZVRYnPiabds81Y')
    console.log('full', full)
    console.log(await indy.abbreviateVerkey('Th7MpTaRZVRYnPiabds81Y',full.verkey))
    console.log(await indy.getMyDidWithMeta(fromWallet, 'Th7MpTaRZVRYnPiabds81Y'))


    const governmentWallet = await indy.openWallet({ 'id': 'governmentWallet' }, { 'key': 'government_key' });
    const [governmentDid, key] = await indy.createAndStoreMyDid(governmentWallet, {
        'seed': crypto.randomBytes(16).toString('hex')
    });
    // await indy.addWalletRecord(governmentWallet, 'government', 'id4', "valor", {a:"22"});
    const governmentRecord = await indy.getWalletRecord(governmentWallet, 'government', 'id4', {retrieveTags:true});
    console.log(governmentRecord)

    const  [ id, schema ] = await indy.issuerCreateSchema ( governmentDid, "esquema1", "1.0", ["nombre", "apellido", "edad"]);
    let schemaRequest = await indy.buildSchemaRequest(governmentDid, schema);
    console.log(id, schema, schemaRequest)
}   

;( async () => {
    await testPack();
} )();