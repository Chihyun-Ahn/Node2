// // var a = new Date();
// // var hour = a.getHours()*3600000;
// // var min = a.getMinutes()*60000;
// // var sec = a.getSeconds()*1000;
// // var milli = a.getMilliseconds();
// // var result = hour+min+sec+milli;
// // console.log(result);

// var time1 = '235959999';
// var time2 = '3';
// var time1milli = convertToMilli(time1);
// var time1original = millToTime(time1milli);
// console.log(time1milli);
// console.log(time1original);

// function convertToMilli(time){
//     var hour = parseInt(time.substr(0,2));
//     var min = parseInt(time.substr(2,2));
//     var sec = parseInt(time.substr(4,2));
//     var milsec = parseInt(time.substr(6,3));

//     var hourToMilli = hour*60*60*1000;
//     var minToMilli = min*60*1000;
//     var secToMilli = sec*1000;

//     var result = hourToMilli+minToMilli+secToMilli+milsec;
//     return result;
// }

// function millToTime(miltime){
//     var imsi;
//     var hour = miltime/3600000;
//     imsi = miltime%3600000;
//     var min = imsi/60000;
//     imsi = imsi%60000;
//     var sec = imsi/1000;
//     imsi = imsi%1000;
//     var milli = imsi;
//     var result = addZero(hour)+':'+addZero(min)+':'+addZero(sec)+':'+addZeroMilli(milli);
//     return result;
// }

// function addZero(num){
//     var result = (num<10)?("0"+num):(""+num);
//     return result;
// };

// function addZeroMilli(num){
//     var result;
//     if(num<10){
//         result = "00"+num;
//     }else if(num >=10 && num<100){
//         result = "0"+num;
//     }else if(num>=100 && num<1000){
//         result = ""+num;
//     }else{
//         console.log('addZeroMilli: Input value is invalid.');
//         return;
//     }
//     return result;
// }

