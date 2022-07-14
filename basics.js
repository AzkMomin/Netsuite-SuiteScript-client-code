let student = [
        {
                stdName : "Arham",
                "stdRoll No" : 10,
                stdSubject :["Statistic" , "Data analysis" , "Data Scince"]
        },
        {
                stdName : "Ali",
                "stdRoll No" : 20,
                stdSubject :["CS" , "Calculus" , "Data Scince"]
        },
        {
                stdName : "Nooh",
                "stdRoll No" : 30,
                stdSubject :["Structure analysis" , "Thermodynamics" , "Data Scince"]
        },
]

for(let i in student){
        console.log(student[i])
}

student[1]["stdRoll No"] = 50

console.log(student[1]["stdRoll No"])
console.log(student[2].stdSubject[2])
student[2].stdSubject[2] = "Vibration"
console.log(student[2].stdSubject[2])

///////// nested objects

const myObj = {
        21 : {
                name : "Arham",
                areaOfInterest : "Data science",
                domain : {
                        "Analytics skills" : "power Bi",
                        "Logical" : "DSA",
                        "coding languages" : ["Python" , "R"]
                }
        },
        22 : {
                name : "Ali",
                areaOfInterest : "Data science",
                domain : {
                        "Analytics skills" : "power Bi",
                        "Logical" : "DSA",
                        "coding languages" : ["Python" , "R"]
                }
        },
        23 : {
                name : "nooh",
                areaOfInterest : "Data science",
                domain : {
                        "Analytics skills" : "power Bi",
                        "Logical" : "DSA",
                        "coding languages" : ["Python" , "R"]
                }
        },
}

console.log(myObj[21]["domain"]["coding languages"][0])


const getDet = (value)=>{
        let result = "";

        let myObj = {
                name : "Arham",
                age : 30,
                Gender : "male",
                interest : "Data science"
        };

        result = myObj[value]
        return result;
}

// const result = getDet("name")
// console.log(result);
let obj = {
        name : "Arham",
        age : 30,
        Gender : "male",
        interest : "Data science"
};

// delete obj.Gender;
// console.log(obj)

const arr = [[20,30] ,[40,50],[60,70]];
const additionArr = (getarr) =>{
        let arrLocal = []
        for(let i = 0; i < arr.length; i++){
                let sum = 0;
                for(let j = 0; j < getarr[i].length; j++){
                        sum = sum + getarr[i][j];
                        
                }
                arrLocal.push(sum)
        
        }
        return arrLocal

}

const finalArr = additionArr(arr)
// console.log(finalArr)

// console.log(Math.floor(Math.random() * 10))

//Ternary operator
let a = 10;
let b = 20;

const equals = (a , b) =>{
        return a === b ? true : false
}

// console.log(equals(a , b))

const ar = [1,2,3]

// ar = [10,11,12]

// console.log(ar)

//Freezig the object

const objChange = () =>{
        const math_constraing = {
                pi : 3.14

        }
        Object.freeze(math_constraing)

        try{
                math_constraing.pi = 33;
        }
        catch(ex){
                console.log(ex)

        }

        return math_constraing.pi;
}

// console.log(objChange())

// arrow function --> function iunstide function
let arra = [4,0.5,-19,5,6,20.0,-20]

const squareList  =(arr) => {
        const squareinteger = arr.filter(num=> Number.isInteger(num) && num > 0).map(x => x+x); 
        return squareinteger;


}
// console.log(squareList(arra))

///// hire orfder function
let increment = (function(){
        return function increment(number , value){
                return number + value
        }
})();

// console.log(increment(2,3))


////// OOPS

class std {
        
}

/////// Asynchoronous functions

/// syntax--> setTiimout(function, duration, para1 , para2, ...) 
const greet = (hello) => {
        console.log(`${hello} how are you`)
}

// setTimeout(greet, 2000 , "Arham")

/// syntax--> clearTimeout(ref variable of dunction where the method is called)
const hello = () =>{
        console.log(`hellow world`)
}

const settimeoutId = setTimeout(hello , 2000)
clearTimeout(settimeoutId);


/// --> setInterval(function, duration, para1 , para2, ...)

const runRepeat = () =>{
        console.log(`Hi`)
}

// setInterval(runRepeat , 1000 )

//////  Callbacks

// Passing function insiide another function

function greet1 (name){
        console.log(`Hello ${name}`)
}

function greeteArham(greet1Fn){
        const name = "Arham";
        greet1Fn(name)
}

// greeteArham(greet1)


const studentList = [
        {name : "Arham" , subject : "MDS"},
        {name : "Ali" , subject : "ML"},
        
]
let stud = {name : "Nooh" , subject : "Civil"};

const enrollStudents = (students,callback) => {
        console.log("fetching...")
        setTimeout(function(){
                studentList.push(students);
                console.log("Successfully enrolerd");
                callback();
        }, 3000)
}

const getStudents = ()=> {
        setTimeout(function(){
                studentList.forEach(element => {
                        console.log(element.name)
                });
        },1000)
}

enrollStudents(stud,getStudents)
