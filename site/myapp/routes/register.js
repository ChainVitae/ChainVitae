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

function regStatus(contract, accounts){
	console.log("isEmployee:");
	for (var i = 0; i < accounts.length; i++){
		console.log(accounts[i] + ": " + contract.isEmployee.call(accounts[i]));
	}
	console.log("isInstitution:");
	for (var i = 0; i < accounts.length; i++){
		console.log(accounts[i] + ": " + contract.isInstitution.call(accounts[i]));
	}
}

function vitaeStatus(vitae){
	console.log(vitae);
	console.log('\tEmployee:\t'+
		web3.toAscii(contract.getEmployeeName.call(vitae)));
	console.log('\tInstitution:\t'+
		web3.toAscii(contract.getInstitutionName.call(vitae)));
	console.log('\tPosition:\t'+
		web3.toAscii(contract.getPosition.call(vitae)));
	console.log('\tFrom:\t\t'+
		contract.getStartTime.call(vitae)+
		' to '+
		contract.getEndTime.call(vitae));
}

function accStatus(contract, acc){
	console.log(acc + ":");
	if (contract.isEmployee.call(acc)){
		console.log("Pending:");
		var cur = 0;
		while (true){
			cur = contract.getNextPending.call(cur, acc);
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Vitaes:");
		cur = 0;
		while (true){
			cur = contract.getNextVitae.call(cur, acc);
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
	}
	else if (contract.isInstitution.call(acc)){
		console.log("Requests:");
		var cur = 0;
		while (true){
			cur = contract.getNextRequest.call(cur, acc);
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Endorsed:");
		cur = 0;
		while (true){
			cur = contract.getNextEndorsed.call(cur, acc);
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
	}
	console.log();
}

function allStatus(contract, accounts){
	for (var i = 0; i < accounts.length; i++){
		var acc = accounts[i];
		accStatus(contract, acc);
	}
}

function getVitaes(acc, n,console) {
    var cur = 0;
    var vitaes = [];
    var vitae;
    while (n >= 0){
        cur = contract.getNextPending.call(cur, acc);
        console.log(cur);
        if (cur == 0 || cur === '0x'){
            console.log('=== End ===');
            break;
        }
        vitaes.push({
            employee : web3.toAscii(contract.getEmployeeName.call(cur)).replace(/\0/g, ''),
            institution : web3.toAscii(contract.getInstitutionName.call(cur)).replace(/\0/g, ''),
            position : web3.toAscii(contract.getPosition.call(cur)).replace(/\0/g, ''),
            from : contract.getStartTime.call(cur).c[0],
            to : contract.getEndTime.call(cur).c[0]
        });
        n--;
    }
    return vitaes;
}


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
            addr: ec(accounts[i]),
            role: role
        });
    }
    res.render('register', { title: 'Express', accounts: acc});
});

router.post('/submit', function(req, res, next) {
    var acc = dc(req.body.address);
    console.log(req.body);
	if (req.body.role == 0){
        if (web3.personal.unlockAccount(acc)){
            contract.registerEmployee(web3.fromAscii(req.body.name), {from: acc});
        }
	}
	else
	if (req.body.role == 1){
        if (web3.personal.unlockAccount(acc)){
            contract.registerInstitution(web3.fromAscii(req.body.name), {from: acc});
        }
	}
	//var acc = req.body.address;
	//if (web3.personal.unlockAccount(acc)){
//		fun(web3.fromAscii(req.body.name), {from: acc});
//	}
	res.redirect('/register');
})
module.exports = router;
