/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', 'N/format'
], function (search, record, format) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const subLine = search.load({
            id: 3476
        });


        return subLine
    }
    const map = (context) => {
        var subLineRecResult = JSON.parse(context.value);
        // log.debug('searchResult : ', subLineRecResult)
        // log.debug('searchResult id: ', SoRecResult.id)
        try {
            var subLineRec = record.load({
                type: subLineRecResult.recordType,
                id: subLineRecResult.id,
                isDynamic: true
            });
            var startDate = subLineRec.getValue('startdate');
            var item = subLineRec.getValue('item');
            

            var formatedStartDate = getFormatedDate(startDate);
            log.debug('formatedStartDate', formatedStartDate)


            var subRec = record.load({
                type: 'subscription',
                id: subLineRecResult.values.subscription.value,
            });
            var businessUnitId = subRec.getValue('class');
            var name = subRec.getText('name');
            var customer = subRec.getValue('customer');
            var subsidiary = subRec.getValue('subsidiary');
            // Create project record
            var projectRecord = record.create({
                type: 'job',
                isDynamic: true
            })

            projectRecord.setValue('companyname', name);
            projectRecord.setValue('parent', customer);
            projectRecord.setValue('custentity_co_project_subscription', subLineRecResult.values.subscription.value);
            projectRecord.setValue('subsidiary', subsidiary);
            projectRecord.setValue('startdate', format.parse({
                value: formatedStartDate,
                type: format.Type.DATE
            }));
           
            projectRecord.setValue('schedulingmethod', "FORWARD");
            projectRecord.setValue('jobbillingtype', "CB");
            projectRecord.setValue('billingratecard', "2");
            projectRecord.setValue('projectexpensetype', -2);
            var businessUnitfield = search.lookupFields({
                type: 'classification',
                id: businessUnitId,
                columns: ['custrecord_bu_project_manager']
            });
            projectRecord.setValue('projectmanager', businessUnitfield.custrecord_bu_project_manager[0].value);
            projectRecord.setValue('custentity_service_item', item);
            projectRecord.setValue('custentity_co_project_subscription', subLineRecResult.values.subscription.value);
            projectRecord.setValue('custentity_subscription_line', subLineRecResult.id);
            
            var prjRecSave = projectRecord.save();
            log.debug('prjRecSave', prjRecSave)

            //create project task


            subLineRec.setValue('custrecord_subscription_line_project', prjRecSave)
            subLineRec.setValue('custrecord_pr_rec_created', true)

            // var billBasedOnMilestone = subLineRec.getValue('custrecord167');
            // var projectMileStoneRecordSave;
            // if (billBasedOnMilestone) {
            //     var itemName = subLineRec.getText('item');

            //     log.debug('itemName', itemName)

            //      // Create milestone record
            //     var projectMileStoneRecord = record.create({
            //         type: 'customrecord_milestone_master_record',
            //         isDynamic: true
            //     })

            //     var name = itemName + " - " + formatedStartDate
            //     log.debug('name', name)
            //     projectMileStoneRecord.setValue('custrecordmilestone_name', name);
            //     projectMileStoneRecord.setValue('custrecord_milestone_subscription', subLineRecResult.values.subscription.value);
            //     projectMileStoneRecord.setValue('custrecord_subscription_milestone_line', subLineRecResult.id);
            //     projectMileStoneRecord.setValue('custrecord_milestone_project', prjRecSave);

            //     projectMileStoneRecordSave = projectMileStoneRecord.save();
            //     log.debug('projectMileStoneRecord ID', projectMileStoneRecordSave)
            // }

            // subLineRec.setValue('custrecord169', projectMileStoneRecordSave)

            var subLineSaveRecId = subLineRec.save()
            log.debug("Project reference updated  on subsdcription line ID : ", subLineSaveRecId);

          
        }


        catch (e) {
            log.debug("error : ", e)
        }

    }
    const getFormatedDate = (fdate) => {
        const date = fdate;
        // newDate.setMonth(date.getMonth() + 3)
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1; // Months start at 0!
        let dd = date.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedDate = mm + '/' + dd + '/' + yyyy;
        return formattedDate
    }
    return {
        getInputData,
        map
    }

});