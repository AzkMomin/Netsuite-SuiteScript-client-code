    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     * @NModuleScope SameAccount
     */
    define(['N/record', 'N/search'],
        (record, search) => {
            const beforeSubmit = (context) => {
                try {
                    const newRecord = context.newRecord;
                    var priceintervalLineCount = newRecord.getLineCount({ sublistId: 'priceinterval' })
                    for (var i = 0; i < priceintervalLineCount; i++) {
                        var priceLinenumber = newRecord.getSublistValue({
                            sublistId: 'priceinterval',
                            fieldId: 'linenumber',
                            line: i
                        })
                        var quantity = newRecord.getSublistValue({
                            sublistId: 'priceinterval',
                            fieldId: 'quantity',
                            line: i
                        })
                        if (quantity != "") {
                            log.debug('quantity : ', quantity)
                            var lineNumber = newRecord.findSublistLineWithValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'linenumber',
                                value: priceLinenumber
                            });

                            if (lineNumber != -1) {
                                var subLineId = newRecord.getSublistValue({
                                    sublistId: 'subscriptionline',
                                    fieldId: 'subscriptionline',
                                    line: lineNumber
                                })

                                // log.debug('subLineId : ', subLineId)
                                var subLineRecSave = record.load({
                                    type: 'subscriptionline',
                                    id: Number(subLineId),
                                    values: {
                                        'custrecord_total_hours': Number(quantity)
                                    }
                                });
                                subLineRecSave.setValue('custrecord_total_hours', Number(quantity))
                                var subLineRecSaveId = subLineRecSave.save()
                                log.debug('subLineRecSaveId : ', subLineRecSaveId)


                            }
                        }

                    }
                } catch (e) {
                    log.error({ title: 'UE Error', details: e });
                }
            }

            return { beforeSubmit };
        }
    );