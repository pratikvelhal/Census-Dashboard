function RunEconomy()
{
    $.get("/econnomicDataMap", function(data, status){
      var mapdata = JSON.parse(data.economicdata.mapdata);
      var maplabel = JSON.parse(data.economicdata.maplabel);
      var wordclouddata = JSON.parse(data.economicdata.wordclouddata)
      drawMap(mapdata,maplabel);
      DrawWordCloud(wordclouddata,"Economy");
      drawHistogram(-1, [], [], []);
    });
}

function RunHealthCare()
{
    $.get("/healthCareMap", function(data, status){
      var mapdata = JSON.parse(data.healthdata.mapdata);
      var maplabel = JSON.parse(data.healthdata.maplabel);
      var wordclouddata = JSON.parse(data.healthdata.wordclouddata)
      drawMap(mapdata,maplabel);
      DrawWordCloud(wordclouddata,"HealthCare");
      drawHistogram(-1, [], [], []);
    });
}

function RunImmigration()
{
    $.get("/immigrationMap", function(data, status){
      var mapdata = JSON.parse(data.immigrationdata.mapdata);
      var maplabel = JSON.parse(data.immigrationdata.maplabel);
      var wordclouddata = JSON.parse(data.immigrationdata.wordclouddata)
      DrawWordCloud(wordclouddata,"Immigration");
      drawMap(mapdata,maplabel);
      drawHistogram(-1, [], [], []);
    });
}
