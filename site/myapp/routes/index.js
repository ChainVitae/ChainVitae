var express = require('express');
var router = express.Router();

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
var abi = fs.readFileSync('../../chainvitae.abi').toString();
var accounts = web3.eth.accounts;
var address = fs.readFileSync('../../addr').toString().trim();
var contract = web3.eth.contract(JSON.parse(abi)).at(address);
if (contract == undefined) throw new Error("contract undefined");
/* GET home page. */
router.get('/', function(req, res, next) {
    var acc = [];
    for (var i=0; i < accounts.length; i++){
        var tmp = web3.toAscii(contract.getName.call(accounts[i]));
        var role;
        if (tmp.length === 0){
            tmp = '**************Not Registered**************';
            role = "";
        }
        else{
            role = contract.isEmployee.call(accounts[i])?'  (Employee)':'   (Institution)';
        }
        acc.push({
            name: tmp,
            addr: accounts[i],
            role: role
        });
    }
    console.log('abc');
    console.log(acc);
	res.render('index', { title: 'ChainVitae', accounts: acc});
});

module.exports = router;
