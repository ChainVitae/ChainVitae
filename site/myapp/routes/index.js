var express = require('express');
var router = express.Router();

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const bs58 = require('bs58');
var abi = fs.readFileSync('../../chainvitae.abi').toString();
var accounts = web3.eth.accounts;
var address = fs.readFileSync('../../addr').toString().trim();
var contract = web3.eth.contract(JSON.parse(abi)).at(address);
if (contract == undefined) throw new Error("contract undefined");

function ec(hex){
    return bs58.encode(Buffer.from(hex.substring(2), 'hex'));
}
function dc(b58){
    if (b58 === undefined) return undefined;
    return "0x" + bs58.decode(b58).toString('hex');
}
/* GET home page. */
router.get('/', function(req, res, next) {
    var acc = [];
    for (var i=0; i < accounts.length; i++){
        var tmp = web3.toAscii(contract.getName.call(accounts[i])).replace(/\0/g, '');
        var role;
        if (tmp.length === 0){
            tmp = '**************Not Registered**************';
            role = "";
        }
        else{
            role = contract.isEmployee.call(accounts[i])?'  (Employee)':'   (Institution)';
        }
        acc.push({
            name: tmp.replace(/\0/g, ''),
            addr: ec(accounts[i]),
            role: role
        });
    }
    console.log('abc');
    console.log(acc);
	res.render('index', { title: 'ChainVitae', accounts: acc});
});

router.get('/search', function(req, res, next){
    console.log('e')
    var hash = dc(req.query.hash);
    try{
        var employee = web3.toAscii(contract.getEmployeeName.call(hash)).replace(/\0/g, '');
        if (employee.length === 0){
            res.send('');
            return;
        }
        var vitae = {
            employee: employee,
            institution: web3.toAscii(contract.getInstitutionName.call(hash)).replace(/\0/g, ''),
            pose: web3.toAscii(contract.getPosition.call(hash)).replace(/\0/g, ''),
            academic: contract.getAcademic.call(hash),
            start: new Date(contract.getStartTime.call(hash).c[0]).getTime(),
            end: new Date(contract.getEndTime.call(hash).c[0]).getTime()
        };
        res.json(vitae);
    }
    catch(err){
        console.log(err);
        res.send('');
    }
});
module.exports = router;
