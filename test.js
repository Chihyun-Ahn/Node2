var a = [0,1,2,3];
const b = 9;
for(i=0;i<a.length;i++){
    if(i!=a.length-1){
        a[i] = a[i+1];
    }else if(i==a.length-1){
        a[i] = b;
    }
}
console.log(a);

