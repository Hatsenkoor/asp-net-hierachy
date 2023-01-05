$.fn.gantt = function (options) {
    let locale = (options.locale)? options.locale: 'en-US';
    moment.locale(locale);
    let dtStart = moment(options.dtStart, "YYYY-MM-DD"); // Define início do calendário
    let dtEnd = moment(options.dtEnd, "YYYY-MM-DD"); // Define fim do calendário
    let countMonth = dtEnd.diff(dtStart, 'month'); // Verifica quantidade de meses entre datas

    let firstDay = '01/'+dtStart.format('MM/YYYY'); // Pega o primeiro dia da data início
    let lastDay = dtEnd.endOf('month').format('DD') +'/'+dtEnd.format("MM/YYYY"); // Pega o último dia da data fim
    let countDays = 1 + moment(lastDay, "DD/MM/YYYY").diff(moment(firstDay, "DD/MM/YYYY"), 'days'); // Verifica a quantidade de dias entre datas
    let tasks = options.data;
    let divGantt = $(this);
	let unic = divGantt.attr('id')+'_'+moment().format('s'); // Cria estancia única para minupular tabela
	let idThead = '#thead_'+unic;
	let idTbody = '#tbody_'+unic;
    let conflicts = '#conflicts_'+unic;
    let tooltipShow = (options.tooltipShow === false)? false: true;

    //return this.each(function () {
    $(this).css({"margin-left": "auto", "margin-right": "auto", "width": "100%"});
    let table = `<div id="conflicts_${unic}"></div><div></div>
                <table class="tb-gantt" id="${unic}">
                    <thead id="thead_${unic}">
                    </thead>
                    <tbody id="tbody_${unic}">
                    </tbody>
                </table>
                `;
    $(this).html(table);

    // Monta o cabeçalho dos meses
    var headerMonthTable = '<th></th>';
    for(let i = 0; i <= countMonth; i++){
        let month = moment(dtStart, "DD/MM/YYYY").add(i, "month").format('MMMM/YYYY');
        let countDaysMonth = moment(dtStart, "DD/MM/YYYY").add(i, "month").endOf('month').format('DD');
        let classMonth = (i % 2 == 0)? 'month-name-odd': 'month-name-par';
        headerMonthTable += `<th class="${classMonth}" colspan="${countDaysMonth}">${month}</th>`;
    }
    $(idThead).html('<tr>'+headerMonthTable+'</tr>');

    // Monta o cabeçalho dos dias
    var headerDaysTable = '<th></th>';
    for(let i = 0; i <= countDays-1; i++){
        let day = moment(firstDay, "DD/MM/YYYY").add(i, "days").format('DD');
        let dayNumber = moment(firstDay, "DD/MM/YYYY").add(i, "days").dayOfYear();
        headerDaysTable += `<th class="days" day_number="${dayNumber}"><p>${day}</p></th>`;
    }
    $(idThead).append('<tr>'+headerDaysTable+'</tr>');

    // Mapeia todos os IDs de dependências
    let deps = $.map(tasks, function(val, i){
        if(val.dep){
            return val.dep.split(',');
        }
    });

    var resConflicts = '';
    $.each(tasks, function(index, task) {
        if(deps.indexOf(task.id.toString()) < 0 && task.date_start && task.date_end){
            let d1 = moment(task.date_start, "YYYY-MM-DD");
            let d2 = moment(task.date_end, "YYYY-MM-DD");
            let taskName = (task.name)? task.name: '';
            let titleName = (task.title)? task.title: taskName;
            let taskColor = (task.color)? task.color: '#ADFF2F';
            let daysCount = d2.diff(d1, 'days') + 1;
            let labelT = (options.labelTask)? taskName: '';
            let classTd = (index % 2 == 0)? 'td-bg1': 'td-bg2';

            var tasksTable = '<tr>';
            tasksTable += `<th colspan="1"><p>&nbsp;&nbsp;${titleName}</p></th>`;
            let colspanStart = moment(task.date_start, "YYYY-MM-DD").diff(moment(firstDay, "DD/MM/YYYY"), 'days');
            if(colspanStart){ // Completa antes da tarefa
                tasksTable += checkCellColspan('start', task, colspanStart, taskName, classTd, taskColor, labelT);
            }
            // Tarefa em si
            tasksTable += checkCellColspan('task', task, daysCount, taskName, classTd, taskColor, labelT);
            if(task.dep){ // Se existe atividades de depedência, passa para função que monta dependências
                let contentDep = loadDep(tasks, task.dep, classTd, task.date_end);
                tasksTable += contentDep.content;
                resConflicts += contentDep.conflicts;
            }

            // Completa depois da tarefa
            let colspanEnd = moment(lastDay, "DD/MM/YYYY").diff(moment(task.date_end, "YYYY-MM-DD"), 'days');
            if(colspanEnd){
                tasksTable += checkCellColspan('end', task, colspanEnd, taskName, classTd, taskColor, labelT);
            }
            $(idTbody).append(tasksTable);
        }

        // Se existe definição de evento click. Atribui ele ao td da atividade
        if(options.click){
            $('.td-tasks').off('click');
            $('.td-tasks').css('cursor','pointer').on('click', function(){
                options.click($(this).attr('task_id'), $(this).attr('task_name'), $(this).attr('task_days'));
            });
        }

        $('#tbody_'+unic+' > tr > .td-tasks').off('mouseover','**');
        $('#tbody_'+unic+' > tr > .td-tasks').off('mousemove','**');
        $('#tbody_'+unic+' > tr > .td-tasks').off('mouseout','**');
        if(tooltipShow){
            $('#tbody_'+unic+' > tr > .td-tasks').on('mouseover', function(){ // Cria o tooltip ao passar o mouse na atividade
                let tooltipGantt = `<div class="tooltip-gantt">
                                    <b>${$(this).attr('task_name')}</b><br>
                                    <span>${$(this).attr('start')} a ${$(this).attr('end')}</span><br>
                                    <span>${$(this).attr('task_days')} dias</span>
                                    <hr>
                                    <span>${$(this).attr('tooltip_desc')}</span>
                                    </div>`;
                $('body').append(tooltipGantt);
                $('.tooltip-gantt').css('z-index', 10000);
                //$('.tooltip-gantt').fadeIn('500');
                //$('.tooltip-gantt').fadeTo('10', 1.9);
            });

            $('#tbody_'+unic+' > tr > .td-tasks').on('mousemove', function(e){ // Arrasta o tooltip de acordo com o mouse
                $('.tooltip-gantt').css('top', e.pageY + 10);
                $('.tooltip-gantt').css('left', e.pageX + 20);
            });

            $('#tbody_'+unic+' > tr > .td-tasks').on('mouseout', function(){ // Remove o tooltip ao tirar o mouse da atividade
                $('.tooltip-gantt').remove();
            });
        }
    });
    // Mostra tarefas conflitantes
    $(conflicts).html(resConflicts);

    /**
     * Monta célula
     * @param {*} type 'start' = cria tds antes da tarefa | 'task' = cria tds da tarefa | 'end' = cria tds depois da tarefa
     * @param {*} task Tarefa que esta sendo passada para popular a td
     * @param {*} qtdColspan Quantidade de colspan para definir a largura da td
     * @param {*} originQtdColspan Quantidade original de colspan que é o mesmo que a quantidade de dias
     * @param {*} taskName Nome da tarefa
     * @param {*} classTd Classe css que será aplicada a td
     * @param {*} taskColor Cor da tarefa
     * @param {*} labelT Nome da tarefa que será exibida de acordo com parâmetro labelTask true ou false
     * @param {*} borderRadius Define qual a borda de arredondamento que será usada
     */
    function fillsCell(type, task, qtdColspan, originQtdColspan, taskName, classTd, taskColor, labelT, borderRadius){
        let tdCell = '';
        if(type == 'start'){
            tdCell += `<td class="${classTd}" colspan="${qtdColspan}"></td>`;
        }
        if(type == 'task'){
            let start = moment(task.date_start, "YYYY-MM-DD").format('DD/MM/YY');
            let end = moment(task.date_end, "YYYY-MM-DD").format('DD/MM/YY');
            let tooltipDesc = (task.tooltip_desc)? task.tooltip_desc: '';
            tdCell += `<td class="${classTd} td-tasks" start="${start}" end="${end}" task_id="${task.id}" task_name="${taskName}" task_days="${originQtdColspan}" tooltip_desc="${tooltipDesc}" colspan="${qtdColspan}">
                                    <div class="div-task ${borderRadius}" style="background-color: ${taskColor};">${labelT}</div>
                                </td>`;
        }
        if(type == 'end'){
            tdCell += `<td class="${classTd}" colspan="${qtdColspan}"></td>`;
        }
        return tdCell;
    }

    /**
     * Verifica quantidade de colspan célula
     * @param {*} type 'start' = cria tds antes da tarefa | 'task' = cria tds da tarefa | 'end' = cria tds depois da tarefa
     * @param {*} task Tarefa que esta sendo passada para popular a td
     * @param {*} qtdColspan Quantidade de colspan para definir a largura da td
     * @param {*} taskName Nome da tarefa
     * @param {*} classTd Classe css que será aplicada a td
     * @param {*} taskColor Cor da tarefa
     * @param {*} labelT Nome da tarefa que será exibida de acordo com parâmetro labelTask true ou false
     */
    function checkCellColspan(type, task, qtdColspan, taskName, classTd, taskColor, labelT){
        let cell = '';
        let originQtdColspan = qtdColspan;
        if(qtdColspan < 1000){ // Se quantidade colspan for menor de 1000
            cell += fillsCell(type, task, qtdColspan, originQtdColspan, taskName, classTd, taskColor, labelT, 'border-radius-full');
        }
        let countLoop = 1;
        while(qtdColspan > 1000){ // Enquanto quantidade colspan for maior que 1000 entra no looping até ficar menor que 1000
            if(qtdColspan > 1000){
                let borderRadius = '';
                if(countLoop == 1){
                    borderRadius = 'border-radius-left';
                }
                cell += fillsCell(type, task, 1000, originQtdColspan, taskName, classTd, taskColor, labelT, borderRadius);
            }
            qtdColspan = qtdColspan - 1000;
            if(qtdColspan < 1000){ // Se quantidade colspan atingir uma quantidade menor que 1000
                cell += fillsCell(type, task, qtdColspan, originQtdColspan, taskName, classTd, taskColor, labelT, 'border-radius-right');
            }
            countLoop++;
        }
        return cell;
    }

    /**
     * Faz o carregamento de atividades dependentes caso tenha alguma
     * @param {*} data Json com os dados
     * @param {*} ids Ids das atividades que são dependentes
     * @param {*} classTd Classe de background-color
     * @param {*} currentDate Data corrente da atividade pai
     * @param {*} firstDay Data início do calendário
     */
    function loadDep(data, ids, classTd, lastDate){
        var content = '';
        var contentConflicts = '';
        $.each(ids.split(','), function(index, id) {

            $.map(data, function(val, i){
                // No mapeamento, se o id do json for igual ao id de alguma dependência e se a data dependência for maior que data corrente. Monta bloco
                if(val.id == id){
                    if(moment(val.date_start, "YYYY-MM-DD").isAfter(moment(lastDate, 'YYYY-MM-DD'))){

                        let d1S = moment(val.date_start, "YYYY-MM-DD");
                        let d2S = moment(val.date_end, "YYYY-MM-DD");
                        let taskNameS = (val.name)? val.name: '';
                        let taskColorS = (val.color)? val.color: '#2E8B57';
                        let daysCountS = d2S.diff(d1S, 'days') + 1;
                        let colspanStartS = d1S.diff(moment(lastDate, "YYYY-MM-DD"), 'days') - 1;
                        let labelTS = (options.labelTask)? taskNameS: '';

                        if(colspanStartS){ // Completa antes da tarefa
                            content += checkCellColspan('start', val, colspanStartS, taskNameS, classTd, taskColorS, labelTS);
                        }

                        content += checkCellColspan('task', val, daysCountS, taskNameS, classTd, taskColorS, labelTS);
                        lastDate = d2S;
                    }else{
                        contentConflicts = `<p>${val.name} (ID: ${val.id}) - Início: ${moment(val.date_start, "YYYY-MM-DD").format('DD/MM/YYYY')} Fim: ${moment(val.date_end, "YYYY-MM-DD").format('DD/MM/YYYY')} esta conflitando</p>`;
                    }
                }
            });

        });
        return {
            content: content,
            conflicts: contentConflicts
        };
    }

    $(function() {
        $('#'+unic).scroll(function(ev) {
            /**
             * When the table scrolls we use the scroll offset to move
             * the axis to the correct place. Use a CSS transform rather
             * that just setting the left and top properties so we keep
             * the table sizing (no position change) and because
             * transforms are hardware accelerated.
             */
            $('#'+unic+'.tb-gantt thead th').css({'transform':'translateY(' + this.scrollTop + 'px)'});

            // There are better ways to handle this, but this make the idea clear.
            $('#'+unic+'.tb-gantt tbody th').css({'transform': 'translateX(' + this.scrollLeft + 'px)'});
        });
    });
};
