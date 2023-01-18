/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog'],
    function (search, dialog) {
        function pageInit(context) {
            var currentRec = context.currentRecord;
        }
        function saveRecord(context) {

            try {
                if (context.mode !== 'create' && context.mode !== 'view') {
                    var currentRec = context.currentRecord;
                    var currentRecId = context.currentRecord.id;

                    // var systemNotesInfoSerchResult = getSearchResult(currentRecId);
                    // log.debug('fields : ', systemNotesInfoSerchResult[0])

                    // var lastModifiedDate = currentRec.getValue({ fieldId: 'custbody_esc_last_modified_date' })
                    // log.debug('lastModifiedDate ' + lastModifiedDate);

                    // var isDateGrater = compareDates(lastModifiedDate, '11/14/2022')
                    // log.debug('isDateGrater ' + isDateGrater);

                    if (isEqual == false) {

                        // Dialogue box for sending mail or not
                        var options = {
                            title: 'Confirm',
                            message: 'Do you want to send massage of this field change.'
                        };


                        //Send mail if user press ok
                        function success(result) {
                            //log.debug('Success with value ' + result);
                            var proc = context.currentRecord.getValue({ fieldId: 'custbody_send_mail' })
                            log.debug('Success with value ', proc);
                            log.debug('Success with value ', typeof proc);
                            log.debug('id ', context.currentRecord.id);
                            context.currentRecord.setValue({ fieldId: 'custbody_send_mail', value: true })

                            var otherId = record.submitFields({
                                type: 'salesorder',
                                id: context.currentRecord.id,
                                values: {
                                    'custbody_send_mail': true
                                }
                            });
                            log.debug('otherId ', otherId);
                        }
                        function failure(reason) {
                            log.debug('Failure: ' + reason);
                        }
                        dialog.confirm(options).then(success).catch(failure);

                    }

                    return true;
                }
            }
            catch (e) {
                log.debug('error : ', e)
            }
        }

        function compareDates(lastModifiedDate, date) {
            var date1 = new Date(lastModifiedDate).getTime();
            var date2 = new Date(date).getTime();

            if (date1 < date2) {
                return true;
            } else if (date1 > date2) {
                return false;
            } else {
                return `Both dates are equal`
            }
        }
        function getSearchResult(currentRecId) {
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
                    ['recordid', 'equalto', currentRecId],
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
                            fields.push({
                                'Date': date,
                                'Field': field
                            })
                        }
                    }
                });
            }
            return fields;
        }




        return {
            pageInit: pageInit,
            saveRecord: saveRecord
        };
    });