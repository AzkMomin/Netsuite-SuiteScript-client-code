/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const salesorderSearch = search.load({
            id: 'customsearch_monogram_orders'
        });


        return salesorderSearch
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
            // isDynamic: true
        });

        try {
            var rate = getRate()
            createlIne(newRecord, rate);
        }
        catch (e) {
            log.debug("error : ", e)
        }

    }

    function getRate() {
        var finalRate
        var nonInvantoryRec = record.load({
            type: 'noninventoryitem',
            id: 11,
        });

        var priceLineCount = nonInvantoryRec.getLineCount({
            sublistId: 'price1',
        });
        var lineNumber = nonInvantoryRec.findSublistLineWithValue({
            sublistId: 'price1',
            fieldId: 'pricelevelname',
            value: 'Online Price'
        });
        var Rate = nonInvantoryRec.getSublistValue({
            sublistId: 'price1',
            fieldId: 'price_1_',
            line: lineNumber,
        });
        if (Rate > 0) {
            finalRate = Rate
        }

        return finalRate;
    }
    function createlIne(newRecord, Rate) {
        var itemExistLine = -1;
        var line;
        var totalQuantity = 0

        var salesOrderLineCount = newRecord.getLineCount({
            sublistId: 'item',
        })


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
            if (monogramming !== "" && itemId != 11) {
                var qty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i,
                })

                var rate = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i,
                })
                log.debug('amount before ', rate);
                rate -= Rate
                log.debug('amount after ', rate);
                newRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i,
                    value: rate
                })

                totalQuantity += qty
            } else if (itemId == 11) {
                itemExistLine = i
            }
        }

        log.debug('Rate  ', Rate);
        log.debug('totalQuantity  ', totalQuantity);
        log.debug('totalQuantity * Rate  ', totalQuantity * Rate);

        if (itemExistLine == -1) {
            line = salesOrderLineCount;
        } else {
            line = itemExistLine
        }

        if (totalQuantity != 0) {
            newRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: line,
                value: 11
            })
            newRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: line,
                value: totalQuantity
            })
            newRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: line,
                value: Rate
            })
            newRecord.setSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: line,
                value: (totalQuantity * Rate)
            })
        }

        var soRecSaveId = newRecord.save();
        log.debug('soRecSaveId  ', soRecSaveId);
    }

    return {
        getInputData,
        map
    }

});