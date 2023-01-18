/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

 define(['N/search', 'N/ui/dialog'], function (search, dialog) {
    
    function beforeSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var oldRec = context.newRecord;
            var newRec = context.oldRecord;

            var oldRecId = context.newRecord.id;


            var oldRecordsFields = getSearchResult()

            //log.debug('oldRecordsFields : ', oldRecordsFields)
            //log.debug('oldRecordsFields length: ', oldRecordsFields.length)


        }
        return oldRecordsFields
    }

    
    function afterSubmit(context) {
        var newRecordsFields = getSearchResult()

        var arrayIsEqual = isEqual(oldRecordsFields, newRecordsFields)
        log.debug('newRecordsFields : ', newRecordsFields)
        log.debug('oldRecordsFields : ', oldRecordsFields)
        //log.debug('oldRecordsFields length: ', oldRecordsFields.length)
        log.debug('arrayIsEqual : ' + arrayIsEqual)



        // var otherId = record.submitFields({
        //     type: 'salesorder',
        //     id: '9293',
        //     values: {
        //         'custrecord_rating': '2'
        //     }
        // });
    }

    function getSearchResult() {
        var systemnoteSearchColRecord = search.createColumn({ name: 'record' });
        var systemnoteSearchColSetBy = search.createColumn({ name: 'name' });
        var systemnoteSearchColDate = search.createColumn({ name: 'date' });
        var systemnoteSearchColContext = search.createColumn({ name: 'context' });
        var systemnoteSearchColType = search.createColumn({ name: 'type' });
        var systemnoteSearchColField = search.createColumn({ name: 'field' });
        var systemnoteSearchColOldValue = search.createColumn({ name: 'oldvalue' });
        var systemnoteSearchColNewValue = search.createColumn({ name: 'newvalue' });
        var systemnoteSearchColRole = search.createColumn({ name: 'role' });
        var systemnoteSearch = search.create({
            type: 'systemnote',
            filters: [
                ['recordtype', 'anyof', '-30'],
                'AND',
                ['recordid', 'equalto', '9293'],
            ],
            columns: [
                systemnoteSearchColRecord,
                systemnoteSearchColSetBy,
                systemnoteSearchColDate,
                systemnoteSearchColContext,
                systemnoteSearchColType,
                systemnoteSearchColField,
                systemnoteSearchColOldValue,
                systemnoteSearchColNewValue,
                systemnoteSearchColRole,
            ],
        });
        var fields = []
        var systemnoteSearchPagedData = systemnoteSearch.runPaged({ pageSize: 1000 });
        for (var i = 0; i < systemnoteSearchPagedData.pageRanges.length; i++) {
            var systemnoteSearchPage = systemnoteSearchPagedData.fetch({ index: i });
            systemnoteSearchPage.data.forEach(function (result) {
                var flag = true
                if (flag == true) {

                    var record = result.getValue(systemnoteSearchColRecord);
                    var setBy = result.getValue(systemnoteSearchColSetBy);
                    var date = result.getValue(systemnoteSearchColDate);
                    var context = result.getValue(systemnoteSearchColContext);
                    var type = result.getValue(systemnoteSearchColType);
                    var field = result.getValue(systemnoteSearchColField);
                    var oldValue = result.getValue(systemnoteSearchColOldValue);
                    var newValue = result.getValue(systemnoteSearchColNewValue);

                    if (field == '' && oldValue == 'T' && newValue == 'F') {
                        flag = false
                    }
                    else {
                        fields.push(field)
                    }
                }
            });
        }
        return fields;
    }

    function isEqual(oldRecordsFields, newRecordsFields) {
        return null;
    }
    return {

        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
    }
});