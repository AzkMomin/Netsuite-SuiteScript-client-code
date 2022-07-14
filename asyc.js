//// Spread operator
// In Array
let arr = [1, 3, 5, 10 ];

let avg = (a, b, c, d)=>{
    return (a + b + c + d)/3
}

// console.log(avg(...arr))

//Array addition ussing spread operator

let arr2 = [5, 4, 9, ...arr, 20, 10]
// console.log(arr2)

///// Spread operator in object
let obj = {
    name : "Arham",
    age :22,
    language : "Python"
}

let obj2 = {...obj , language: "Java"}
// console.log(obj2)

let {name, age, language} = obj;
// console.log(obj)

// -------------------------------------------------------------------------------------------------------------


////////Promises

// const func1 = ()=>{
//     return new Promise((resolve , reject)=>{
//         console.log("Promis pending")
//         setTimeout(()=>{
//             const isTrue = true;
//             console.log("Promis executed")
//             if(isTrue){
//                 console.log("Promis is resolve");
//                 resolve();
//             }
//             else{
//                 console.log("Promis is not been resolved");
//                 reject("Promis got rejected")
//             }
//         },3000)
//     })
// }

// func1().then(()=>{
//     console.log("Thanks for resolving")
// }).catch(()=>{
//     console.log("Please try again to resolve")
// })

// -------------------------------------------------------------------------------------------------------------------

// const studentList = [
//     {name : "Arham" , subject : "MDS"},
//     {name : "Ali" , subject : "ML"},
    
// ]

// let stud = {name : "Nooh" , subject : "Civil"}

// const enrollStd = (stud)=>{
//     return new Promise((resolve, reject)=>{
//             let isTrue = false;
//             console.log("Enrolling...");
//             studentList.push(stud);
//             console.log("Enroled sucessfully");
//             isTrue = true;

        
//         setTimeout(()=>{
//             if(isTrue){
//                 resolve();
//             }else{
//                 reject();
//             }
//         },2000)
//     })
// }

// enrollStd(stud).then(()=>{
//     setTimeout(()=>{
//         studentList.forEach(element=>{
//             console.log(`name : ${element.name} , subject : ${element.subject}`)
//         })
//     })
// }).catch(()=>{
//     console.log("Some error occured")
// })

// --------------------------------------------------------------------------------------------------------------

// let api = "https://api.github.com/users?since=XXX"
// async function harry(){
//     console.log("inside harry function");
//     const response = await fetch(api)
//     console.log("Before response");
//     const users = await response.json();
//     console.log("user resolve")
//     return users
// }

// console.log("before calling harry");
// let a = harry();
// console.log("After calling harry");
// console.log(a);
// a.then(data => console.log(data))
// console.log("Last line of this file")




// ----------------------------------------------------------------------------------------------



// class vehicle {
//     constructor(name , speed){
//         this.name = name;
//         this.speed = speed;
//     }

//     introduce(){
//         console.log(`name is ${this.name} and speed is ${this.speed}`)
//     }
// }
// class suzuki extends vehicle{
//     constructor(name, speed, rpm){
//         super(name, speed)
//         this.rpm = rpm;
//     }
//     introduce(){
//         console.log(`${this.name} and ${this.speed} and rpm is ${this.rpm}`)
//     }
    
// }

// let olto = new vehicle("Range rover" , "200");

// olto.introduce()
// let car2 = new suzuki("Range rover" , "200");
// car2.introduce()

// let car3 = new suzuki("Hrrier" , "250" , 256)
// car3.introduce();

// ---------------------------------------------------------------------------------------------------------------------


// const promis1 = Promise.resolve(2);
// const promis2 = 34;
// const promis3 = new Promise((resolve,reject)=>{
//     setTimeout(resolve,100,"foo")
// })

// Promise.all([promis1,promis2,promis3]).then((value)=>{
//     console.log(value)
// })

// const studentList = [
//     {name : "Arham" , subject : "MDS"},
//     {name : "Ali" , subject : "ML"},
    
// ]

// let stud = {name : "Nooh" , subject : "Civil"}

// const enrollStd = (stud)=>{
//     return new Promise((resolve, reject)=>{
//         const isTrue = ()=>{
//             try{
//                 console.log("Pushing....")
//                 studentList.push(stud)
//                 console.log("Enroll successfully")
//                 return true
//             }catch(err){
//                 return false
//             }
//         }
//         const whileTrue = isTrue();

//         setTimeout(()=>{
//             if(whileTrue == true){
//                 resolve()
//             }
//             else{
//                 console.log("rejected")
//                 reject()
//             }
//         },2000)
//     })
// }
// enrollStd(stud).then(()=>{
//     studentList.forEach(element => {
//         console.log(`name is :${element.name} , subject is : ${element.subject}`)
//     });
// }).catch(()=>{
//     console.log("Something went wrong please check and try again")
// })  


//====================  Sequential execution  ================
// function resolveHello(){
//     return new Promise(resolve =>{
//         setTimeout(()=>{
//             resolve("hello")
//         },2000)
//     })
// }
// function resolveWorld(){
//     return new Promise(resolve =>{
//         setTimeout(()=>{
//             resolve("Hello world")
//         },3000)
//     }) 
// }

// async function sequentialStart(){
//     const hello = await resolveHello()
//     console.log(hello)

//     const world = await resolveWorld();
//     console.log(world);
// }
// sequentialStart()

///===================== Concurrent execution ============================
// function resolveHello(){
//     return new Promise(resolve =>{
//         setTimeout(()=>{
//             resolve("hello")
//         },2000)
//     })
//     }
// function resolveWorld(){
//     return new Promise(resolve =>{
//         setTimeout(()=>{
//             resolve("Hello world")
//         },1000)
//     }) 
// }

// async function sequentialStart(){
//     const hello = resolveHello();
//     const world = resolveWorld();

//     console.log(await hello) //It take 2 second to execute and print
//     console.log(await world) // It is already execute parallely with the above function 
//                              // It wont take time to print as soon as above will print tit also get printed

// }
// sequentialStart()

//==========================  Parallel Execution =============================
// async function parallel(){
//     Promise.all([
//         (async ()=>console.log(await resolveHello()))(),
//         (async ()=>console.log(await resolveWorld()))(),
//     ])

// }
// parallel()



const studentList = [
    {name : "Arham" , subject : "MDS"},
    {name : "Ali" , subject : "ML"},
    
]

let stud = {name : "Nooh" , subject : "Civil"}


const enrollStd = async (stud)=>{
    console.log("Pushing....")
    studentList.push(stud)
    console.log("uccessfull push....")
}

enrollStd(stud).then(()=>{
    studentList.forEach(i =>{
        console.log(`anem : ${i.name} , subject : ${i.subject}`)
    })

}).catch(()=> console.log("something went wrong"))