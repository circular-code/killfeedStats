function query (data) {
    for (var i = 0; i < data.messages.length; i++) {
        
        let message = data.messages[i];
        let content = message.content;
        let victim;
        let deathReason;
        let killer;
        let weapon;
        let distance;
if (content) {

        if (content.indexOf("committed suicide") > -1) {
            victim = content.split("committed suicide")[0];
            deathReason = "suicide";
        }
        else if (content.indexOf("died to an explosion") > -1) {
            victim = content.split("died to an explosion")[0];
            deathReason = "explosion";
        }
        else if (content.indexOf("died to the environment") > -1) {
            victim = content.split("died to the environment")[0];
            deathReason = "environment";
        }
        else {
        
            let killLineArray = [];

            if (content.indexOf("got killed by") !== -1)
                killLineArray = content.split(" got killed by ");
            
            else if (content.indexOf("GOT KILLED BY") !== -1)
                killLineArray = content.split(" GOT KILLED BY ");
            
            deathReason = "kill";
            victim = killLineArray[0];
            message.victim = victim;
            
            killer = killLineArray[1];
            if (killer) {
                killer = killer.split(',');

                weapon = killer[1];
                if (weapon && weapon.indexOf("with a") > -1) {
                    weapon = weapon.split("with a");
                    weapon = weapon[1];
                }

                distance = killer[2];
                if (distance && distance.indexOf("distance")) {
                    distance = distance.split("distance");
                    distance = distance[1];

                    if (distance && distance.indexOf("meters")) {
                        distance = distance.split("meters");
                        distance = distance[0];
                    }
                }

                killer = killer[0];
            }
        }
        message.victim = victim ? victim.trim().replaceAll('**', '') : "";
        message.killer = killer ? killer.trim().replaceAll('**', '') : "";
        message.deathReason = deathReason ? deathReason.trim().replaceAll('**', '') : "";
        message.distance = distance ? distance.trim().replaceAll('**', '') : "";
        message.weapon = weapon ? weapon.trim().replaceAll('**', '') : "";
}
delete message.type;
delete message.id;
delete message.timestampEdited;
delete message.callEndedTimestamp;
delete message.isPinned;
delete message.author;
delete message.attachments;
delete message.embeds;
delete message.stickers;
delete message.reactions;
delete message.mentions;
delete message.content;
    }
    return data;
}

$(() => {
    $('#gridContainer').dxDataGrid({
        dataSource: data,
        allowColumnReordering: true,
        columnsAutoWidth: true,
        showBorders: true,
        grouping: {
        autoExpandAll: true,
        },
        height: 600,
        searchPanel: {
        visible: true,
        },
        paging: {
        pageSize: 10,
        },
        groupPanel: {
        visible: true,
        },
        filterRow: {
            visible: true,
            applyFilter: 'auto',
        },
        headerFilter: {
        visible: true,
        },
        sorting: {
            mode: 'multiple',
        },
        sortByGroupSummaryInfo: [{
            summaryItem: 'count',
        }],
        columns: [
            {
            dataType: 'datetime',
            allowSearch: false,
            format: 'dd.MM.yyyy HH:mm',
            editorOptions: { type: 'date' },
            dataField: 'timestamp'
        },
        'victim', 'killer', 'weapon', 'distance', 'deathReason'],
        scrolling: {
            mode: 'virtual',
        },
        summary: {
            totalItems: [{
              column: 'victim',
              summaryType: 'count',
            },
            {
                column: 'killer',
                summaryType: 'count',
              },
              {
                column: 'weapon',
                summaryType: 'count',
            }],
            groupItems: [{
                column: 'victim',
                summaryType: 'count',
              },
              {
                  column: 'killer',
                  summaryType: 'count',
                },
                {
                  column: 'weapon',
                  summaryType: 'count',
            }],
          },
    });

    var killers = [];
    data.forEach(entry => {
        if (entry.deathReason !== 'kill' || entry.killer.indexOf("Survivor") > -1 || entry.timestamp.indexOf("2023-07") === -1)
            return;

        var existingKiller = killers.filter(x => x.name === entry.killer);
        if (existingKiller)
            existingKiller = existingKiller[0];

        if (existingKiller)
            killers[killers.indexOf(existingKiller)].kills++;
        else
            killers.push({kills: 1, name: entry.killer});
    });

    console.log(killers.sort((a, b) => b.kills - a.kills));
    showObjectData(killers, document.getElementById('best'), ["kills", "name"]);

    players = [];
    data.forEach(entry => {

        if (entry.deathReason === 'kill' && entry.killer.indexOf("Survivor") === -1) {
            var killer = players.filter(x => x.name === entry.killer);
            if (killer)
                killer = killer[0];
    
            if (killer)
                players[players.indexOf(killer)].kills++;
            else
                players.push({kills: 1, deaths: 0, name: entry.killer});
        }

        if (entry.victim.indexOf("Survivor") === -1) {
            var victim = players.filter(x => x.name === entry.victim);
            if (victim)
                victim = victim[0];
    
            if (victim)
                players[players.indexOf(victim)].deaths++;
            else
                players.push({deaths: 1, kills: 0, name: entry.victim});
        }
    });

    players.sort((a, b) => b.kills - a.kills);
    showObjectData(players, document.getElementById('allTime'), ["kills", "name"]);

    players.sort((a, b) => b.deaths - a.deaths);
    showObjectData(players, document.getElementById('deaths'), ["deaths", "name"]);

    players.forEach(player => {
        player.kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills;
    });

    console.log(players.sort((a, b) => b.kd - a.kd));
    showObjectData(players, document.getElementById('bestKd'), ["kd", "name"]);

    var weapons = [];
    data.forEach(entry => {
        if (entry.deathReason !== 'kill')
            return;

        var existingWeapon = weapons.filter(x => x.weapon === entry.weapon);
        if (existingWeapon)
            existingWeapon = existingWeapon[0];

        if (existingWeapon)
            weapons[weapons.indexOf(existingWeapon)].kills++;
        else
            weapons.push({kills: 1, weapon: entry.weapon});
    });

    console.log(weapons.sort((a, b) => b.kills - a.kills));
    showObjectData(weapons, document.getElementById('bestWeapons'), ["kills", "weapon"]);
});

function showObjectData(data, target, properties) {

     const list = document.createElement("ol");
 
    data.forEach((obj) => {
        const listItem = document.createElement("li");
        properties.forEach(property => {
            const propertyText = document.createTextNode(`${obj[property]} `);
            listItem.appendChild(propertyText);
        });
        list.appendChild(listItem);
    });
    target.appendChild(list);
}
