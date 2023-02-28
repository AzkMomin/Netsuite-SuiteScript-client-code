/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const transactionSearchColInternalId = search.createColumn({ name: 'internalid' });
        const transactionSearchColDocumentNumber = search.createColumn({ name: 'tranid' });
        const transactionSearch = search.create({
            type: 'transaction',
            filters: [
                [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['mainline', 'is', 'T'],
                ],
                'AND',
                [
                    [
                        ['datecreated', 'on', 'today'],
                        'AND',
                        ['custbody_mono_line_added', 'is', 'F'],
                    ],
                    'OR',
                    [
                        ['trandate', 'onorafter', 'startoflastfiscalyear'],
                        'AND',
                        ['status', 'noneof', 'SalesOrd:G', 'SalesOrd:H'],
                        'AND',
                        ['custbody_mono_line_added', 'is', 'F'],
                    ],
                ],
            ],
            columns: [
                transactionSearchColInternalId,
                transactionSearchColDocumentNumber,
            ],
        });
        return transactionSearch
    }

    const map = (context) => {
        var SoRecResult = JSON.parse(context.value);
        //log.debug('searchResult : ', SoRecResult)
        log.debug('searchResult id: ', SoRecResult.id)
        var SOId = record.submitFields({
            type: 'salesorder',
            id: SoRecResult.id,
            values: {
                'custbody_mono_line_added': true
            }
        });
       
        
        var newRecord = record.load({
            type: "salesorder",
            id: SoRecResult.id,
            isDynamic: true
        });

        var salesOrderLineCount = newRecord.getLineCount({
            sublistId: 'item',
        })
        //log.debug('salesOrderLineCount: ', salesOrderLineCount)

        let itemExist = isItemExist(newRecord, salesOrderLineCount)

        //log.debug('itemExist  ', itemExist);

        let totalQuantity = getTotalQuantity(newRecord, salesOrderLineCount);
        // log.debug('totalQuantity  ', totalQuantity);
        
        try {
            if (totalQuantity != 0) {
                var rate = getRate()
                createlIne(newRecord, rate, totalQuantity, salesOrderLineCount, itemExist);
            }
        }
        catch (e) {
            log.debug("error : ", e)
        }

    }

    function isItemExist(newRecord, salesOrderLineCount) {
        for (var i = 0; i < salesOrderLineCount; i++) {
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            })

            if (itemId == 11) {
                return true
            }

        }
        return false;
    }

    function getTotalQuantity(newRecord, salesOrderLineCount) {
        var totalQuantity = 0;
        log.debug('salesOrderLineCount  ', salesOrderLineCount);
        for (var i = 0; i < salesOrderLineCount; i++) {
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            });

            var monogramming = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_hb_monogramming',
                line: i,
            });
            var priceLevel = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'price_display',
                line: i,
            });
            //log.debug('monogramming  ', monogramming);
            //log.debug('priceLevel  ', priceLevel);

            if (monogramming !== "" && priceLevel == 'Online Price' && itemId != 11) {
                var qty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i,
                })

                totalQuantity += qty
            }

        }

        return totalQuantity;
    }

    function getRate() {
        var nonInvantoryRec = record.load({
            type: 'noninventoryitem',
            id: 11,
            isDynamic: true
        });

        var priceLineCount = nonInvantoryRec.getLineCount({
            sublistId: 'price1',
        });
        var Rate = nonInvantoryRec.getSublistValue({
            sublistId: 'price1',
            fieldId: 'price_1_',
            line: 9,

        });
        if (Rate > 0) {
            return Rate *= -1
        }

        return Rate;
    }
    function createlIne(newRecord, Rate, totalQuantity, salesOrderLineCount, itemExist) {
        if (itemExist) {
            salesOrderLineCount -= 1;
            newRecord.selectLine({
                sublistId: 'item',
                line: salesOrderLineCount,
            });
        } else {
            newRecord.selectNewLine({
                sublistId: 'item',
                line: salesOrderLineCount,
            });
        }


        log.debug('Rate  ', Rate);
        log.debug('totalQuantity  ', totalQuantity);
        log.debug('totalQuantity * Rate  ', totalQuantity * Rate);

        newRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: salesOrderLineCount,
            value: 11
        })
        newRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: salesOrderLineCount,
            value: totalQuantity
        })
        newRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: salesOrderLineCount,
            value: Rate
        })
        newRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: salesOrderLineCount,
            value: (totalQuantity * Rate)
        })
        newRecord.commitLine({
            sublistId: 'item'
        });

        
        var soRecSaveId = newRecord.save();
        log.debug('soRecSaveId  ', soRecSaveId);
    }

    return {
        getInputData,
        map
    }

});