/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/format', 'N/record', 'N/search'], function (format, record, search) {
    function afterSubmit(context) {
        if (context.type == 'create' || context.type == 'edit') {
            try {
                var newRecord = context.newRecord

                var ProjectMilestone = record.load({
                    type: 'customrecord_milestone_master_record',
                    id: newRecord.id,
                   
                });

                var lineCount = ProjectMilestone.getLineCount('recmachcustrecord_milestone_reference')
                log.debug('lineCount : ', lineCount)
                for (var i = 0; i < lineCount; i++) {
                    var milestonePercent = ProjectMilestone.getSublistValue('recmachcustrecord_milestone_reference','custrecord_milestone_percentagedisp',i); //.split('.')

                    var subscriptionName = ProjectMilestone.getText('custrecord_milestone_subscription');

                    var subscriptionLineID = ProjectMilestone.getValue('custrecord_subscription_milestone_line');

                    var name = milestonePercent + " - " + subscriptionName

                    var subLinefield = search.lookupFields({
                        type: 'subscriptionline',
                        id: subscriptionLineID,
                        columns: ['custrecord_subscription_line_project']
                    });
                    var ProjectTaskRec = record.create({
                        type: 'projecttask',
                        isDynamic: true
                    });

                    ProjectTaskRec.setValue('ismilestone', true);
                    ProjectTaskRec.setValue('title', name);
                    ProjectTaskRec.setValue('plannedwork', 0);

                    ProjectTaskRec.setValue('company', subLinefield.custrecord_subscription_line_project[0].value);
                    var ProjectTaskRecSave = ProjectTaskRec.save()
                    log.debug('ProjectTaskRecSave : ',ProjectTaskRecSave)
                }

                // log.debug("status : ", status)

            } catch (ex) {
                log.debug(ex.name, ex.message);
            }
        }



    }



    return {

        afterSubmit: afterSubmit,

    }
});