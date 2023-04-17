/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', 'N/format'
], function (search, record, format) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const projecttaskSearch = search.load({
            id: 3480
        })


        return projecttaskSearch
    }
    const map = (context) => {
        var projecttaskSearch = JSON.parse(context.value);
        log.debug('searchResult : ', projecttaskSearch)
        // log.debug('searchResult id: ', SoRecResult.id)
        try {
            var chargeRuleRec = record.create({
                type: record.Type.CHARGE_RULE,
                isDynamic: true,
                defaultValues: {
                    'chargeruletype': 'MILESTONE'
                }
            });


            chargeRuleRec.setValue('name', projecttaskSearch.values.title);
            chargeRuleRec.setValue('project', projecttaskSearch.values.company.value);
            chargeRuleRec.setValue('projecttask', projecttaskSearch.id);
            chargeRuleRec.setValue('amount', Number(projecttaskSearch.values.custevent_milestone_amount));
            chargeRuleRec.setValue('billingitem', projecttaskSearch.values['custentity_service_item.job'].value);
            chargeRuleRec.setValue('stage', "READY_FOR_BILLING");


            var chargeRuleRec = chargeRuleRec.save()
            log.debug("Charge Rule Record ID : ", chargeRuleRec);
            var projectTaskRec = record.submitFields({
                type: 'projecttask',
                id:projecttaskSearch.id,
                values: {
                    'custevent_milestone_rule_validation': true
                }
            });
            log.debug("Charge rule is created for project task Record ID : ", projectTaskRec);
        }
        catch (e) {
            log.debug("error : ", e)
        }

    }

    return {
        getInputData,
        map
    }

});