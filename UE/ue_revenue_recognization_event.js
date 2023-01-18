/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

define(['N/record'], function (record) {
   

    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;


            var subscriptionLineCountnew = newRecord.getLineCount({
                sublistId: 'subscriptionline',
            })
            var subscriptionLineCountold = oldRecord.getLineCount({
                sublistId: 'subscriptionline',
            })
            log.debug('lineCount before : ', subscriptionLineCountold)
            log.debug('lineCount after : ', subscriptionLineCountnew)


            if (subscriptionLineCountnew > subscriptionLineCountold) {
                for (var i = 0; i < subscriptionLineCountnew; i++) {
                    var subscriptionLineId = newRecord.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'subscriptionline',
                        line: i,
                    })
                    log.debug('Subscription line id ', subscriptionLineId);

                    var subscriptionlineRecord = record.load({
                        type: 'subscriptionline',
                        id: subscriptionLineId
                    });


                    var goLiveDate = subscriptionlineRecord.getValue({
                        fieldId: 'custrecord_go_live_date'
                    })
                    log.debug('goLiveDate before: ', goLiveDate)

                    var date = new Date(goLiveDate);
                    var day = date.getDate();
                    var month = date.getMonth() + 1;
                    var year = date.getFullYear();

                    if (day < 10) {
                        day = '0' + day;
                    }
                    if (month < 10) {
                        month = '0' + month;
                    }
                    goLiveDate = month + "/" + day + "/" + year;

                    log.debug('goLiveDate : ', goLiveDate)
                    log.debug('goLiveDate typeof : ', typeof goLiveDate)

                    try {
                        if (goLiveDate != "") {
                            var revenueRecognizationRec = record.create({
                                type: 'billingrevenueevent',

                            })

                            revenueRecognizationRec.setValue({ fieldId: 'subscriptionline', value: subscriptionLineId })
                            revenueRecognizationRec.setValue({ fieldId: 'eventtype', value: 1 })
                            revenueRecognizationRec.setValue({ fieldId: 'eventdate', value: new Date(goLiveDate) })

                            var revenueRecognizationRecId = revenueRecognizationRec.save()
                            log.debug(" Record is successfully save with Id : ", revenueRecognizationRecId)
                        }
                    }
                    catch (e) {
                        log.debug('Error : ', e)
                    }
                }
            }

        }
    }
    return {
       
        afterSubmit: afterSubmit
    }


})