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
		web3.toAscii(contract.getEmployee.call(vitae)));
	console.log('\tInstitution:\t'+
		web3.toAscii(contract.getInstitution.call(vitae)));
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
			cur = contract.getNextPending.call(cur, acc, {from: acc});
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Vitaes:");
		cur = 0;
		while (true){
			cur = contract.getNextVitae.call(cur, acc, {from: acc});
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
			cur = contract.getNextRequest.call(cur, acc, {from: acc});
			if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Endorsed:");
		cur = 0;
		while (true){
			cur = contract.getNextEndorsed.call(cur, acc, {from: acc});
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
  while (n >= 0){
    cur = contract.getNextRequest.call(cur, acc, {from: acc});
	if (cur == 0 || cur === '0x'){
      console.log('=== End ===');
      break;
    }
    vitaes.push({
      employee : web3.toAscii(contract.getEmployee.call(cur)).replace(/\0/g, ''),
      institution : web3.toAscii(contract.getInstitution.call(cur)).replace(/\0/g, ''),
      position : web3.toAscii(contract.getPosition.call(cur)).replace(/\0/g, ''),
      from : contract.getStartTime.call(cur).c[0],
      to : contract.getEndTime.call(cur).c[0],
      hash : cur
    });
    n--;
  }
  return vitaes;
}


/* GET home page. */
router.get('/', function(req, res, next) {
	var institution = req.query.addr;
	var requestedVitaes = {};
	console.log(institution);
	if (institution != null){
		requestedVitaes = getVitaes(institution, 10, console);
	}
    console.log(requestedVitaes);
	res.render('endorse', { title: 'Express', vitaes: requestedVitaes, accounts: web3.eth.accounts});
});

router.get('/ajax', function(req, res, next){
	var institution = req.query.addr;
	var requestedVitaes = [];
	if (institution != null){
		requestedVitaes = getVitaes(institution, 10, console);
	}
    res.send(requestedVitaes);
    res.end();
});

router.get('/endorse', function(req, res, next) {
	if (web3.personal.unlockAccount(req.body.addr)){
		contract.endorse(
			req.body.vitae,
			{from: req.body.addr, gas: 400000}
		)
		res.redirect('/endorse');
	}
})

module.exports = router;
