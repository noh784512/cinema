 // project of uos-db
// made by gohn

module.exports = function(app)
{
    const ERROR = "ERROR";
    const OK = "OK";
    

}


function UniqueDateTime(format='',language='en-US'){
    //returns a meaningful unique number based on current time, and milliseconds, making it virtually unique
    //e.g : 20170428-115833-547
    //allows personal formatting like more usual :YYYYMMDDHHmmSS, or YYYYMMDD_HH:mm:SS
    var dt = new Date();
    var modele="YYYYMMDD-HHmmSS-mss";
    if (format!==''){
        modele=format;
    }
    modele=modele.replace("YYYY",dt.getFullYear());
    modele=modele.replace("MM",(dt.getMonth()+1).toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("DD",dt.getDate().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("HH",dt.getHours().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("mm",dt.getMinutes().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("SS",dt.getSeconds().toLocaleString(language, {minimumIntegerDigits: 2, useGrouping:false}));
    modele=modele.replace("mss",dt.getMilliseconds().toLocaleString(language, {minimumIntegerDigits: 3, useGrouping:false}));
    return modele;
}