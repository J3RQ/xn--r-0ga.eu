function buttonalert() {
    alert("ÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ");
}

function timereplace() {
    var d = new Date();
    var timeinput = d.toLocaleTimeString().split(":");
    var pretime = `${timeinput[0]}:${timeinput[1]}`
    document.getElementById("time-input").value = pretime;
    document.getElementById("date-input").value = new Date().toISOString().slice(0, 10);
}

function nyssestops(stopinput, timeinput, dateinput, lineinput) {
  
    let stoprequest
    let querymode
    let timestamp

    let timesplit = timeinput.split(":")
    let datesplit = dateinput.split("-")
    
    timestamp = Math.round(new Date(datesplit[0], datesplit[1] - 1, datesplit[2], timesplit[0], timesplit[1]).getTime() / 1000)


    switch (isNaN(stopinput)) {
        case false:
            querymode = "ID";
            stoprequest = `query {
            stop(id: "tampere:${stopinput}") {
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
            stops(name: "${stopinput}") {
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
    var finalquery = JSON.stringify({ "query": stoprequest })

    stopreq.send(finalquery);

    stopreq.onload = () => {
        stopreq.responseText;
        const stopJSON = JSON.parse(stopreq.responseText);

        function secondsToTime(d) {
            d = Number(d);
            var h = Math.floor(d / 3600);
            var m = Math.floor(d % 3600 / 60);

            finalh = ""
            switch (h.toString().length < 2) {
                case true:
                    finalh = `0${h}`
                    break;
                case false:
                    finalh = h
                    break;
            }
            finalm = ""
            switch (m.toString().length < 2) {
                case true:
                    finalm = `0${m}`
                    break;
                case false:
                    finalm = m
                    break;
            }

            return `${finalh}:${finalm}`
        }

        if (querymode == "ID") {
            var element = document.getElementById("timetablediv");
            if (typeof (element) != 'undefined' && element != null) {
                var resultdiv = document.getElementById("timetablediv");
            } else {
                var resultdiv = document.createElement("div");
            }
            resultdiv.setAttribute("id", "timetablediv")
            resultdiv.setAttribute("class", "textdiv")
            let htmlcontent = ""
            if (stopJSON["data"]["stop"] != null) {
                htmlcontent += `<strong>${stopJSON["data"]["stop"]["name"]}</strong><br><br>`
                let arrivalJSON = stopJSON["data"]["stop"]["stoptimesWithoutPatterns"];
                for (const busJSON in arrivalJSON) {
                    let base = arrivalJSON[busJSON];
                    let destination = base["headsign"];
                    let line = base["trip"]["route"]["shortName"];
                    let timepoint = base["timepoint"];
                    let arrtime;
                    let deptime;
                    switch (base["realtimeArrival"] < 86400) {
                        case true:
                            arrtime = secondsToTime(base["realtimeArrival"]);
                            break;
                        case false:
                            arrtime = secondsToTime(base["realtimeArrival"] - 86400);
                            break;
                        default:
                            arrtime = secondsToTime(0);
                    }
                    switch (base["realtimeDeparture"] < 86400) {
                        case true:
                            deptime = secondsToTime(base["realtimeDeparture"]);
                            break;
                        case false:
                            deptime = secondsToTime(base["realtimeDeparture"] - 86400);
                            break;
                        default:
                            deptime = secondsToTime(0);
                    }
                    base["realtimeDeparture"];
                    let realtime = base["realtimeState"];

                    htmlcontent += `Line: ${line}<br>Destination: ${destination}<br>Arrival: ${arrtime}<br>Departure: ${deptime}<br><br>`;

                }
            } else {
                htmlcontent = "That stop doesn't exist.";
            }
            resultdiv.innerHTML = htmlcontent;
            document.body.appendChild(resultdiv);

        } else if (querymode == "NAME") {
            var element = document.getElementById("timetablediv");
            if (typeof (element) != 'undefined' && element != null) {
                var resultdiv = document.getElementById("timetablediv");
            } else {
                var resultdiv = document.createElement("div");
            }
            resultdiv.setAttribute("id", "timetablediv");
            resultdiv.setAttribute("class", "textdiv");
            let htmlcontent = ""
      
            if (stopJSON["data"]["stops"].length > 0) {
                for (const stopOBJ in stopJSON["data"]["stops"]) {
                    if (stopJSON["data"]["stops"][stopOBJ]["gtfsId"].includes("tampere")) {
                        htmlcontent += `Name: ${stopJSON["data"]["stops"][stopOBJ]["name"]}<br>ID: ${stopJSON["data"]["stops"][stopOBJ]["code"]}<br><br>`;
                    }
                }
                if (htmlcontent.length == 0) {
                    htmlcontent += "No results found.";
                }
            } else {
                htmlcontent = "No results found.";
            }
            resultdiv.innerHTML = htmlcontent;
            document.body.appendChild(resultdiv);

        }

    }

}