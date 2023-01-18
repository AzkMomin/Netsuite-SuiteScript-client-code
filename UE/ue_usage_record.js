/**
*@NApiVersion 2.0
*@NScriptType UserEventScript
*/
define(['N/record', 'N/error', 'N/search'],
    function (record, error, search) {
        function beforeSubmit(context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT ) { 
                var usage = context.newRecord;
                var quantity = usage.getValue({
                    fieldId: "usagequantity"
                });

                var custrecord = usage.getValue({
                    fieldId: "customer"
                });	
                

                var subscriptionLineRecordId = usage.getValue({
                    fieldId: 'usagesubscriptionline'
                })
				
                var subscriptionId = usage.getValue({
                    fieldId: 'usagesubscription'
                });

                log.debug('custrecord :: '+ custrecord)
                log.debug('subscriptionLineRecordId :: '+ subscriptionLineRecordId)
                log.debug('subscriptionId :: '+ subscriptionLineRecordId)

                var subscriptionLineRecord = record.load({
                    type: 'subscriptionline', 
                    id: subscriptionLineRecordId
                });

                var maxHours = subscriptionLineRecord.getValue({
                    fieldId: "custrecord156"
                })

                var usageSearchColQuantity = search.createColumn({ name: 'quantity' });
                var usageSearchColDate = search.createColumn({ name: 'date' });
                var usageSearchColStatus = search.createColumn({ name: 'status' });
                var usageSearchColCustomer = search.createColumn({ name: 'customer' });
                var usageSearchColSubscriptionLine = search.createColumn({ name: 'subscriptionline' });
                var usageSearchColSubscriptionPlan = search.createColumn({ name: 'subscriptionplan' });
                var usageSearchColItem = search.createColumn({ name: 'item' });
                var usageSearchColMemo = search.createColumn({ name: 'memo' });
                var usageSearchColSubscription = search.createColumn({ name: 'subscription' });
                var usageSearchColExternalId = search.createColumn({ name: 'externalid' });
                var usageSearch = search.create({
                    type: 'usage',
                    filters: [
                        ['subscription.internalidnumber', 'equalto', subscriptionId],
                        'AND',
                        ['subscriptionline.internalidnumber', 'equalto', subscriptionLineRecordId],
                    ],
                    columns: [
                        usageSearchColQuantity,
                        usageSearchColDate,
                        usageSearchColStatus,
                        usageSearchColCustomer,
                        usageSearchColSubscriptionLine,
                        usageSearchColSubscriptionPlan,
                        usageSearchColItem,
                        usageSearchColMemo,
                        usageSearchColSubscription,
                        usageSearchColExternalId,
                    ],
                });
            
                var actualConsumed = 0;
                var usageSearchPagedData = usageSearch.runPaged({ pageSize: 1000 });
                for (var i = 0; i < usageSearchPagedData.pageRanges.length; i++) {
                    var usageSearchPage = usageSearchPagedData.fetch({ index: i });
                    
                    usageSearchPage.data.forEach(function (result){
                        var quantity = result.getValue(usageSearchColQuantity);
                        var date = result.getValue(usageSearchColDate);
                        var status = result.getValue(usageSearchColStatus);
                        var customer = result.getValue(usageSearchColCustomer);
                        var subscriptionLine = result.getValue(usageSearchColSubscriptionLine);
                        var subscriptionPlan = result.getValue(usageSearchColSubscriptionPlan);
                        var item = result.getValue(usageSearchColItem);
                        var memo = result.getValue(usageSearchColMemo);
                        var subscription = result.getValue(usageSearchColSubscription);
                        var externalId = result.getValue(usageSearchColExternalId);

                        actualConsumed += parseFloat(quantity);

                        log.debug('Subscription Data :: ', quantity + ' : '+ date + " : " + subscriptionLine + " : " + subscriptionPlan + " : " + item)
                    });
                }

                var quantityActual = parseFloat(quantity) + parseFloat(actualConsumed)

                log.debug('Quantity :: ', parseInt(quantity))
                log.debug('Quantity Actual :: ', parseInt(actualConsumed))
                log.debug('Max Hours :: ', parseInt(maxHours))

                function createError(){
                    var errorText = "Usage Limit Exceeded";
                    var msg = '<style>.text {display: none;}' // this will hide the JSON message
                            + '.bglt td:first-child:not(.textboldnolink):after {'
                            + 'color:black;font-size:8pt;' // set the desired css for our message
                            + 'content: url(/images/5square.gif) \''
                            +  errorText 
                            + '\'}'                     
                        + '</style>';

                    var myCustomError = error.create({
                        name: 'NO_JSON',
                        message: msg,
                        notifyOff: true
                    });

                    log.error('Error: '+ myCustomError.name, myCustomError.message)
                    throw myCustomError;
                }

                if (quantityActual > parseFloat(maxHours)) {
                    createError();
                }
            }
        }

        return {
            beforeSubmit: beforeSubmit
        };
    });