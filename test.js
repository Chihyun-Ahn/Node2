function aaa(){
    var i = 1;
    console.log('Probe'+i+' has been sent.');
    var sendProbe = setInterval(function(){
        i++;
        if(i>3){
            clearInterval(sendProbe);
        };
        if(i<=3){
            console.log('Probe'+i+' has been sent.');
        }
    }, 2000);
}

aaa();
