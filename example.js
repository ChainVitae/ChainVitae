const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
var abi = fs.readFileSync('ChainVitae_sol_ChainVitae.abi').toString();
var accounts = web3.eth.accounts;
var address;
address = "0xde27320858E4dD4f22664D2E896C0B51F6D2ED66";
var contract;
if (address == undefined){
	contract = web3.eth.contract(JSON.parse(abi)).new({
		from: accounts[0],
		data: fs.readFileSync('ChainVitae_sol_ChainVitae.bin').toString(),
		gas: '4700000'
	});
	address = contract.address;
}
else{
	contract = web3.eth.contract(JSON.parse(abi)).at(address);
}
if (contract == undefined) throw "contract undefined";

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
			cur = contract.getNextPending.call(cur, acc);
			if (cur == 0){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}	
		console.log("Vitaes:");
		cur = 0;
		while (true){
			cur = contract.getNextVitae.call(cur, acc);
			if (cur == 0){
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
			if (cur == 0){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}	
		console.log("Endorsed:");
		cur = 0;
		while (true){
			cur = contract.getNextEndorsed.call(cur, acc);
			if (cur == 0){
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

regStatus(contract, accounts);
/*if (web3.personal.unlockAccount(accounts[0])){
	var employeeName = 'aa';
	contract.registerEmployee(web3.fromAscii(employeeName), {from: accounts[0]});
}
regStatus(contract, accounts);
if (web3.personal.unlockAccount(accounts[1])){
	var institutionName = 'google';
	contract.registerInstitution(web3.fromAscii(institutionName), {from: accounts[1]});
}
if (web3.personal.unlockAccount(accounts[0])){
	var post = 'software engineer';
	var start = 2016;
	var end = 2017;
	contract.request(accounts[1], web3.fromAscii(post), start, end, {from: accounts[0], gas: 400000}, function(err, res){if (err) console.log(err); else console.log(res);});
}

if (web3.personal.unlockAccount(accounts[0])){
	var post = 'janitor';
	var start = 2017;
	var end = 2018;
	contract.request(accounts[1], web3.fromAscii(post), start, end, {from: accounts[0], gas: 400000}, function(err, res){if (err) console.log(err); else console.log(res);});
}

if (web3.personal.unlockAccount(accounts[1])){
	contract.endorse(contract.getNextRequest.call(0, accounts[1]), {from: accounts[1], gas: 300000});
}*/
allStatus(contract, accounts);
