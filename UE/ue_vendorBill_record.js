/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record'], function (record) {

    return {
        afterSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var vendorRecId = context.newRecord.id;

                var termRecId = newRecord.getValue({'fieldId' : 'terms'});
                var invoiceDate = newRecord.getValue({'fieldId' : 'custbody_ant_hb_invdate'});
                

                //loading record
                var termRec = record.load({
                    type : 'term',
                    id : termRecId
                })
                
                var netDueVal = termRec.getValue({'fieldId' : 'daysuntilnetdue'})

                if(invoiceDate != ''){
                    var vendorBillDateObj = new Date(invoiceDate);
                    log.debug('invoicDateObj : ' , invoicDateObj)

                    var timeStamp = vendorBillDateObj.setDate(vendorBillDateObj.getDate() + parseInt(netDueVal))
                    log.debug('timeStamp : ' , timeStamp)

                    var dateObj = new Date(timeStamp);
                    log.debug('dateObj : ' , dateObj)

                    var date = dateObj.toString()
                    log.debug('date : ' , date)

                    record.submitFields({
                        type : 'vendorbill',
                        id : vendorRecId,
                        values : {
                            duedate : new Date(date) 
                        }
                    })
                }
                else {
                    record.submitFields({
                        type: 'vendorbill',
                        id: invRecId,
                        values: {
                            duedate: ""
                        }  
                    })

                }
            }
        }
    }


})