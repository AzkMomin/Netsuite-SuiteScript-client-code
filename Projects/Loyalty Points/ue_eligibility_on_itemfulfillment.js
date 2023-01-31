/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            let newRec = context.newRecord;
            let status = newRec.getValue({ fieldId: "status" });

            var equivalentDollarValue = 0;
            //Check for shipped status
            if (status == "Shipped") {
                let SO_ID = newRec.getValue({ fieldId: "createdfrom" });
                let customerID = newRec.getValue({ fieldId: "entity" });

                var So_Fields = search.lookupFields({
                    type: 'salesorder',
                    id: SO_ID,
                    columns: ['custentity_is_member']
                });
                var customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerID,
                    columns: ['custentity_lp_reference']
                });
            
                // let expireIsGraterThenToday = expireIsGrater(customerID)
                
                if (So_Fields.custentity_is_member && !customerFields.custentity_lp_reference) {//Check for isMember is true &&  customer rec contains LP reference
                    const itemFullLineCount = newRec.getLineCount({ sublistId: "item" });
                    for (let i = 0; i < itemFullLineCount; i++) {
                        let itemFulfillmentItemId = getSublistValue({
                            sublistId: 'item',
                            fieldId: "item",
                            line: i
                        })

                        var SORecord = record.load({
                            type: "salesorder",
                            id: SO_ID,
                        });
                        const SO_LineCount = SORecord.getLineCount({ sublistId: "item" });

                        for (let s = 0; s < SO_LineCount; s++) {
                            let SOitemId = getSublistValue({
                                sublistId: 'item',
                                fieldId: "item",
                                line: s
                            })

                            if (itemFulfillmentItemId == SOitemId) {
                                let itemFulFillmentQty = getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "quantity",
                                    line: i
                                })
                                let SOitemRate = getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "rate",
                                    line: s
                                })

                                equivalentDollarValue += (itemFulFillmentQty * SOitemRate)
                            }
                        }

                    }
                }



                log.debug("equivalentDollarValue : ", equivalentDollarValue);

                newRec.setValue({ fieldId: "custbody_lp_record_reference", value: customerFields.custentity_lp_reference })
                newRec.setValue({ fieldId: "custbody_lp_awarded", value: equivalentDollarValue })

                var LP_Fields = search.lookupFields({
                    type: 'customrecord_loyalty_points',
                    id: customerFields.custentity_lp_reference,
                    columns: ['custrecord_lp_balance']
                });

                let finalLpPoints = LP_Fields.custrecord_lp_balance + equivalentDollarValue
                log.debug('Final loyalty points calculated : ', finalLpPoints)
                const LPSaveID = record.submitFields({
                    type: "customer",
                    id: customerID,
                    values: {
                        "custrecord_lp_balance": finalLpPoints
                    }
                });

                log.debug('Final loyalty points calculated saved LP rec id : ', LPSaveID);

            }
        }
    }
    return {
        beforeSubmit,
    }
});