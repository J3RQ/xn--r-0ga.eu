function buttonalert() {
    alert("ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ");
}

function nyssestops(userinput) {
    let stoprequest
    let querymode 
    const timestamp = Math.round(Date.now() / 1000);

    switch (isNaN(userinput)) {
        case false:
        querymode = "ID";
        stoprequest = `query {
            stop(id: "tampere:${userinput}") {
                name
                gtfsId
                stoptimesWithoutPatterns(numberOfDepartures: 16, startTime: ${timestamp}, omitNonPickups: true, timeRange: 10800) {
                    scheduledArrival
                    realtimeArrival
                    arrivalDelay
                    scheduledDeparture
                    realtimeDeparture
                    departureDelay
                    realtime
                    realtimeState
                    serviceDay
                    headsign
                    timepoint
                    stopSequence
                    pickupType
                    trip {
                        route {
                            shortName
                            longName
                            }
                        }
                    }      
                }   
            }`;
            break;
        case true:
        querymode = "NAME";
        stoprequest = `query {
            stops(name: "${userinput}") {
                name
                gtfsId
                lat
                lon
                code
                }     
            }`;
        break;
        default:
            querymode = undefined;
            stoprequest = undefined;
        }
    
    let stopreq = new XMLHttpRequest();
    stopreq.open("POST", "https://api.digitransit.fi/routing/v1/routers/waltti/index/graphql");
    stopreq.setRequestHeader("Content-Type", "application/json");
    var finalquery = JSON.stringify({"query": stoprequest})

    stopreq.send(finalquery);

    stopreq.onload = () => {stopreq.responseText;
    const stopJSON = JSON.parse(stopreq.responseText);

    if (querymode == "ID") {
        console.log(stopJSON["data"]["stop"]["name"]);
    } else {
        
    }

    }

}