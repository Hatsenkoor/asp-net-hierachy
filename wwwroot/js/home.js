$(document).ready(function () {    
    drawEmployees(0, 0);
});

function drawEmployee(el){	
    var parentId = $(el).closest("li").find('input').val();

	if($(el).hasClass('fa-plus-circle')){
		$(el).removeClass('fa-plus-circle');
		$(el).addClass('fa-minus-circle');
	}else{
		$(el).addClass('fa-plus-circle');
		$(el).removeClass('fa-minus-circle');
		$('#parent_'+parentId).fadeOut();
		return;
	}

	if($('#input_'+parentId).val() == -1) {
		$('#parent_'+parentId).fadeIn();
		return;
	}
    
    $('#input_'+parentId).val(-1);

	drawEmployees(parentId, $('#depth_'+parentId).val());
}

function drawEmployees(parentId, depth)
{
    $.ajax({
        type: 'GET',
        url: apiUrl,
        datatype: JSON,
        data: {'path': 'https://pf.maf.gov.om/pmsdemoapi/mobileapi.ashx?app=11&actn=171&id='+parentId},
        success: function(data) {
            var emloyeesList = JSON.parse(data);
            var employees = emloyeesList.list;
            var html = '';
            $.each(employees, function(index, employee){
                html+='<li class="dropdown">'
                html+='<a href="#" onclick="showEmpName('+"'"+employee.Name+"'"+')" class="depth'+depth+'">'
                html+='<img src="'+employee.ImageUrl+'" />'                
                html+='<div>'
                html+='<h4>'+employee.Name+'</h4>'
                html+='<p>'+employee.Name+'</p>'
                html+='</div>'
				html+='<input type="hidden" value="'+employee.ID+'" />'
				html+='<input type="hidden" value="'+employee.ID+'" id="input_'+employee.ID+'"/>'
				html+='<input type="hidden" value="'+(parseInt(depth)+1)+'" id="depth_'+employee.ID+'"/>'

				if(depth < 2) {
					html+='<span class="toggler">'
					html+='<i class="fa fa-plus-circle" onclick="drawEmployee(this)"></i>'
					html+='</span>'
				}
				
                html+='</a>'
                html+='<ul id="parent_'+employee.ID+'" class="submenu"></ul>'
                html+='</li>'                
            });
            $('#parent_'+parentId).append(html);
			$('#parent_'+parentId).fadeIn();
        },
        error: function (data) { }
    })
}

function showEmpName(name)
{
    $('#employeeName').text(name);
}