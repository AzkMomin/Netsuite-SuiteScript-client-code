/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(["N/record", "N/search","N/format"], function (record, search,format) {


    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == 'edit') {
            var newRecord = context.newRecord;
            try{

                var item = newRecord.getValue({ fieldId: 'item' });
                if(item == 15493){
    
                    var startDate = new Date(newRecord.getValue({ fieldId: 'startdate' }));
                    log.debug('startDate : ', startDate)
        
                    var futureDate = new Date(startDate.getTime() + (90 * 24 * 60 * 60 * 1000));
                    var formatedFutureDate = getFormatedDate(futureDate)
                    log.debug("formatedFutureDate : ", formatedFutureDate);
                    newRecord.setValue('enddate', format.parse({
                        value: formatedFutureDate,
                        type: format.Type.DATE
                    }))
                }
            }
            catch(e){
                log.debug('e : ', e)
            }

        }
    }
    const getFormatedDate = (fdate) => {
        const date = fdate;

        // newDate.setMonth(date.getMonth() + 3)
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1; // Months start at 0!
        let dd = date.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedDate = mm + '/' + dd + '/' + yyyy;
 

        return new Date(formattedDate)
    }
    return {

        beforeSubmit: beforeSubmit
    }


})