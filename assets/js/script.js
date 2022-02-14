const popup=document.querySelector('.pop_up');
const close=document.querySelector('.close_box');

// window.onload=function(){
//     setTimeout(function(){
//         popup.style.display='block';
//     },2000)

// }

close.addEventListener('click',()=>{
    popup.style.display='none';
})


// Change Drop down
dropdown_items = document.querySelectorAll(".dropdown-item")
for(let item of dropdown_items){
    item.addEventListener('click', (e) => {
          e.target.parentElement.parentElement.previousElementSibling.innerHTML = e.target.innerHTML
})
}


