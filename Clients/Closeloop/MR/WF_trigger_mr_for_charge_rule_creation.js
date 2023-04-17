/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/task'], function (task) {
    function onAction(scriptContext) {
        log.debug({
            title: 'Start Script'
        });

        const projecttaskSearch = search.load({
            id: 3480
        })
        
        var scriptTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 'customscript_mr_create_charge_rule',
        });

        var taskId = scriptTask.submit();
        log.debug('taskId', taskId);

        var taskStatus = task.checkStatus(taskId);
        log.debug('taskStatus', taskStatus);
        return 1;
    }
    return {
        onAction: onAction
    }
}); 