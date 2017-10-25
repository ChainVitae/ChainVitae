pragma solidity ^0.4.17;
contract ChainVitae{

    struct node{
        bytes32 prev0;
        bytes32 prev1;
        vitae data;
        bytes32 next0;
        bytes32 next1;
    }

    struct date{
        uint8 day;
        uint8 month;
        uint year;
    }

    struct vitae{
        string institutionName;
        string employeeName;
        address employee;
        string positionName;
        date startDate;
        date endDate;
    }

    mapping(address => mapping(uint8 => bytes32)) head;
    mapping(address => mapping(uint8 => bytes32)) tail;
    mapping(bytes32 => node) records;

    mapping(address => string) employee;
    mapping(address => string) institution;
    mapping(bytes32 => vitae) vitaes;

    function request(address institutionAddr, string positionName, uint8 startDay, uint8 startMonth, uint startYear, uint8 endDay, uint8 endMonth, uint endYear) public returns(bytes32){
        require(isEmployee());
        require(keccak256(institution[institutionAddr]) != keccak256(""));
        require(endYear >= startYear);
        if (endYear == startYear){
            require(endMonth >= startMonth);
            if (endMonth == startMonth){
                require(endDay >= startDay);
            }
        }
        bytes32 hash = keccak256(
            institutionAddr,
            institution[institutionAddr],
            employee[msg.sender],
            msg.sender,
            positionName,
            startDay,
            startMonth,
            startYear,
            endDay,
            endMonth,
            endYear
        );
        records[hash] = node({
            prev0:  tail[msg.sender][0],
            prev1:  tail[institutionAddr][0],
            data:
                vitae({
                    institutionName: institution[institutionAddr],
                    employeeName: employee[msg.sender],
                    employee: msg.sender,
                    positionName: positionName, 
                    startDate: date({
                        day: startDay,
                        month: startMonth,
                        year: startYear
                    }), 
                    endDate: date({
                        day: endDay,
                        month: endMonth,
                        year: endYear
                    })
                }),
            next0:  0,
            next1:  0
        });
        if (head[msg.sender][0] == 0){
            head[msg.sender][0] = hash;
        }
        if (head[institutionAddr][0] == 0){
            head[institutionAddr][0] = hash;
        }
        if (tail[msg.sender][0] != 0){
            records[tail[msg.sender][0]].next0 = hash;
        }
        tail[msg.sender][0] = hash;
        if (tail[institutionAddr][0] != 0){
            records[tail[institutionAddr][0]].next1 = hash;
        }
        tail[institutionAddr][0] = hash;
        return hash;
    }
    
    function endorse(bytes32 hash) public{
        require(keccak256(institution[msg.sender]) == keccak256(records[hash].data.institutionName));
        address employeeAddr = records[hash].data.employee;
        bytes32 temp0 = records[hash].prev0;
        bytes32 temp1 = records[hash].prev1;
        bytes32 temp2 = records[hash].next0;
        bytes32 temp3 = records[hash].next1;

        if (temp0 != 0){
            records[temp0].next0 = temp2;
        }
        else{
            head[employeeAddr][0] = temp2;
        }
        if (temp1 != 0){
            records[temp1].next1 = temp3;
        }
        else{
            head[msg.sender][0] = temp3;
        }
        if (temp2 != 0){
            records[temp2].prev0 = temp0;
        }
        else{
            tail[employeeAddr][0] = temp0;
        }
        if (temp3 != 0){
            records[temp3].prev1 = temp1;
        }
        else{
            tail[msg.sender][0] = temp1;
        }
        if (head[employeeAddr][1] == 0){
            head[employeeAddr][1] = hash;
        }
        if (head[msg.sender][1] == 0){
            head[msg.sender][1] = hash;
        }
        if (tail[employeeAddr][1] != 0){
            records[tail[employeeAddr][1]].next0 = hash;
        }
        tail[employeeAddr][1] = hash;
        if (tail[msg.sender][1] != 0){
            records[tail[msg.sender][1]].next1 = hash;
        }
        tail[msg.sender][1] = hash;
    }
    
    function registerEmployee(string name) public{
        require(!isEmployee());
        employee[msg.sender] = name;
    }
    
    function isEmployee() public returns (bool){
        return (keccak256(employee[msg.sender]) != keccak256(""));
    }
    
    function isEmployee(address addr) public returns (bool){
        return (keccak256(employee[addr]) != keccak256(""));
    }
    
    function registerInstitution(string name) public{
        require(!isInstitution());
        institution[msg.sender] = name;
    }
    
    function isInstitution() public returns (bool){
        return (keccak256(institution[msg.sender]) != keccak256(""));
    }
    
    function isInstitution(address addr) public returns (bool){
        return (keccak256(institution[addr]) != keccak256(""));
    }
    
    bytes32[] arr;
    function getPending() public returns (bytes32[]){
        require(isEmployee());
        arr.length = 0;
        bytes32 current = head[msg.sender][0];
        while(current != 0x0){
            arr.push(current);
            current = records[current].next0;
        }
        return arr;
    }
    
    function getRequests() public returns (bytes32[]){
        require(isInstitution());
        arr.length = 0;
        bytes32 current = head[msg.sender][0];
        while(current != 0x0){
            arr.push(current);
            current = records[current].next1;
        }
        return arr;
    }
    
    function getVitaes() public returns (bytes32[]){
        require(isEmployee());
        arr.length = 0;
        bytes32 current = head[msg.sender][1];
        while (current != 0x0){
            arr.push(current);
            current = records[current].next0;
        }
        return arr;
    }
}

