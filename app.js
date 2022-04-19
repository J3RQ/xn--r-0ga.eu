function buttonalert() {
    alert("ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ");
}


function nyssestops(userinput) {
    switch (isNaN(userinput)) {
        case false:
            stoprequest = `{"test": "test"}`;
            break;
        case true:
            stoprequest = `{"test": "test1"}`;
            break;
        default:
            stoprequest = undefined;
        }
    
    let stopreq = new XMLHttpRequest();
    stopreq.open("POST", "https://api.digitransit.fi/routing/v1/routers/waltti/index/graphql");

    stopreq.send(stoprequest);

    stopreq.onload = () => console.log(xhr.responseText);

}