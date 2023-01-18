/**
 * @NScriptName Concatinate all usage memo and add to charge memo 
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record', 'N/search'], function (record, search) {
    function beforeSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var chargeRecId = context.newRecord.id;
            //try{
            var chargeStartDate = newRecord.getValue({ 'fieldId': 'custrecord_cl_startdates' });
            var chargeEndDate = newRecord.getValue({ 'fieldId': 'custrecord_cl_charge_end_date' });
            var subscriptionLine = newRecord.getText({'fieldId': 'subscriptionline'})
            
              
            //Charge start date  string conversion
            var currentStartDate = new Date(chargeStartDate);
            var currentStartDayOfMonth = currentStartDate.getDate();
            var currentStartMonth = currentStartDate.getMonth();
            var currentStartYear = currentStartDate.getFullYear();
            var chargeStartDateString = (currentStartMonth + 1) + "/" + currentStartDayOfMonth + "/" + currentStartYear;

            //Charge end date  string conversion
            var currentEndDate = new Date(chargeEndDate);
            var currentEndDayOfMonth = currentEndDate.getDate();
            var currentEndMonth = currentEndDate.getMonth();
            var currentEndYear = currentEndDate.getFullYear();
            var chargeEndDateString = (currentEndMonth + 1) + "/" + currentEndDayOfMonth + "/" + currentEndYear;

           log.debug('chargeStartDateString : ' + chargeStartDateString)
            log.debug('chargeEndDateString : ' + chargeEndDateString)

            var usageSearchColInternalId = search.createColumn({ name: 'internalid', sort: search.Sort.ASC });
            var usageSearchColMemo = search.createColumn({ name: 'memo' });
            var usageSearchColDate = search.createColumn({ name: 'date' });
            var usageSearchColItem = search.createColumn({ name: 'item' });
            var usageSearch = search.create({
                type: 'usage',
                filters: [
                    ['date', 'within', chargeStartDateString, chargeEndDateString],
                    'AND',
                    ['subscriptionline', 'anyof', subscriptionLine],
                ],
                columns: [
                    usageSearchColInternalId,
                    usageSearchColMemo,
                    usageSearchColDate,
                    usageSearchColItem,
                ],
            });

            var finalMemo = ''
            var usageSearchPagedData = usageSearch.runPaged({ pageSize: 1000 });

            for (var i = 0; i < usageSearchPagedData.pageRanges.length; i++) {
                var usageSearchPage = usageSearchPagedData.fetch({ index: i });
                usageSearchPage.data.forEach(function (result) {

                    var memo = result.getValue(usageSearchColMemo);

                    finalMemo += memo

                    //log.debug('memo : ' + memo)

                });
            }

            log.debug('finalMemo : ' + finalMemo);

             newRecord.setValue({
                 fieldId: 'memo',
                 value: finalMemo
             })



        }

  		
        else if (context.type == context.UserEventType.CREATE) {
            var newRecord = context.newRecord;
            var chargeRecId = context.newRecord.id;
            //try{
            var serviceStartDate = newRecord.getValue({ 'fieldId': 'servicestartdate' });
            var serviceEndDate = newRecord.getValue({ 'fieldId': 'serviceenddate' ,  });
          
           
            log.debug('serviceStartDate  : ' + serviceStartDate + "type : " + typeof serviceStartDate)
            log.debug('serviceStartDate  : ' + serviceStartDate)


            //Charge start date  string conversion
            var currentStartDate = new Date(serviceStartDate);
            var currentStartDayOfMonth = currentStartDate.getDate();
            var currentStartMonth = currentStartDate.getMonth();
            var currentStartYear = currentStartDate.getFullYear();
            var serviceStartDateString = (currentStartMonth + 1) + "/" + currentStartDayOfMonth + "/" + currentStartYear;

            //Charge end date  string conversion
            var currentEndDate = new Date(serviceEndDate);
            var currentEndDayOfMonth = currentEndDate.getDate();
            var currentEndMonth = currentEndDate.getMonth();
            var currentEndYear = currentEndDate.getFullYear();
            var serviceEndDateString = (currentEndMonth + 1) + "/" + currentEndDayOfMonth + "/" + currentEndYear;

            log.debug('servicestartDateString : ' + serviceStartDateString)
            log.debug('serviceendDateString : ' + serviceEndDateString)

            var usageSearchColInternalId = search.createColumn({ name: 'internalid', sort: search.Sort.ASC });
            var usageSearchColMemo = search.createColumn({ name: 'memo' });
            var usageSearchColDate = search.createColumn({ name: 'date' });
            var usageSearchColItem = search.createColumn({ name: 'item' });
            var usageSearchColProcessed = search.createColumn({ name: 'custrecordcustusage_processed' });
            var usageSearch = search.create({
                type: 'usage',
                filters: [
                    ['date', 'within', serviceStartDateString, serviceEndDateString],
                    
                ],
                columns: [

                    usageSearchColInternalId,
                    usageSearchColMemo,
                    usageSearchColDate,
                    usageSearchColItem,
                    usageSearchColProcessed,
                ],
            });

            var finalMemo = ''
            
            var usageSearchPagedData = usageSearch.runPaged({ pageSize: 1000 });

            for (var i = 0; i < usageSearchPagedData.pageRanges.length; i++) {
                var usageSearchPage = usageSearchPagedData.fetch({ index: i });
                usageSearchPage.data.forEach(function (result) {

                    var memo = result.getValue(usageSearchColMemo);
                    var processed = result.getValue(usageSearchColProcessed);
                    var usageInternalId = result.getValue(usageSearchColInternalId);

                    if(processed == 'F'){
                        finalMemo += memo
                        record.submitFields({
                            type: 'usage',
                            id: usageInternalId,
                            values: {
                                custrecordcustusage_processed: 'T'
                            }
                        })
                    }


                    //log.debug('memo : ' + memo)

                });
            }

            log.debug('finalMemo : ' + finalMemo);

             newRecord.setValue({
                 fieldId: 'memo',
                 value: finalMemo
             })

            
        }
    }



    return {
        beforeSubmit: beforeSubmit,
     	

    }

})