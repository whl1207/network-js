//定义力导向图类
class network{
    constructor(canvas,node,edge){//初始化操作
        this.canvas=canvas;
        this.c=canvas.getContext("2d");;
        this.w=this.canvas.width;
        this.h=this.canvas.height;
        //节点
        this.node=[];
        this.edge=[];
        if(node!=undefined){this.node=node;}
        //边
        if(edge!=undefined){this.edge=edge;}
        //斥力系数
        this.af=10;
        //拉力系数
        this.bf=this.w*this.h/100;
        //中心系数
        this.cf=0.05;
        //阻力系数
        this.zx=1.05;
        //绘图帧率
        this.frame=25;
        //背景颜色
        this.bgcolor="#101010";

        //节点默认颜色
        this.nodecolor="#aaaaaa";
        //节点大小
        this.nodesize=7;
        //节点名称颜色
        this.nodenamecolor="#ffffff";
        //是否显示节点名称
        this.nodenamedisplay=true;

        //边颜色
        this.edgecolor="#aaaaaa";
        //边宽度
        this.edgesize=2;
        //初始布局
        this.initgraphtype="随机";
        //点击时标签模式
        this.cmodel="无行为";

        this.mousedown=false;

        //选中节点的id
        this.id=undefined;

        this.setxy();
        
        let that= this;//避免内部事件this无法使用
        this.canvas.onmousedown = function(e) {
            that.mousedown = true
            let x=e.clientX-canvas.getBoundingClientRect().left;
            let y=e.clientY-canvas.getBoundingClientRect().top;
            that.id=that.getnode(x,y);
            if(that.id!=undefined){
                that.node[that.id].c="#00aa00";
                //标签模式
                if(that.cmodel=="显示距离"){
                    that.showDistance(that.id);
                }else if(that.cmodel=="距离上色"){
                    that.showDistanceColor(that.id);
                }
                
                that.canvas.onmousemove = (e) => {
                    if (that.mousedown&&that.id!=undefined) {
                        let x=e.clientX-canvas.getBoundingClientRect().left;
                        let y=e.clientY-canvas.getBoundingClientRect().top;
                        that.node[that.id].x=x;
                        that.node[that.id].y=y;
                    }
                }
            }
        }
        
        this.canvas.onmouseup = function() {
            that.mousedown = false;
            if(that.id!=undefined){
                if(that.cmodel!="距离上色"){
                    that.node[that.id].c="#aaaaaa";
                }
            }
            that.graph();
            that.id=undefined;
        }
        //开始绘图
        this.graph();
	}
    //根据参数创建网络
    create(node,edge){
        this.node=node;
        this.edge=edge;
        this.setxy();
        this.graph();
    }
    //创建随机网络
    createRandom(n,e){
        this.node=[];
        for(var i=0;i<n;i++){
            this.node.push({id:i,name:i});
        }
        //线
        this.edge=[];
        for(var i=0;i<e;i++){
            let a=parseInt(Math.random()*n);
            let b=parseInt(Math.random()*n);
            this.edge.push({a:a,b:b});
        }
        this.setxy();
        this.graph();
    }
    //创建树
	createTree(n){
        this.node=[];
        this.edge=[];
		for(var i=0;i<n;i++){
            this.node.push({id:i,name:i});
        }
		let s=[0];
		let sn=Array.from({length:n},(v, k) => k);
		let a=0;
		let b=0;
		sn.splice(0,1);
		while(s.length<n){
			a=s[parseInt(Math.random()*s.length)];
			b=sn[parseInt(Math.random()*sn.length)];
			sn.splice(sn.indexOf(b),1);
			this.edge.push({a:a,b:b});
			s.push(b);
		}
        this.setxy();
        this.graph();
	}
    //创建ER网络
    createER(n,p){
        this.node=[];
        for(var i=0;i<n;i++){
            this.node.push({id:i,name:i});
        }
        this.edge=[];
        for(var i=0;i<n;i++){
            for(var j=0;j<n;j++){
                if(Math.random()<p&&i!=j){
                    this.edge.push({a:i,b:j});
                }
            }
        }
        this.setxy();
        this.graph();
    }
    //创建无标度网络
    createSF(n){
        this.node=[
            {id:0,name:0},
            {id:1,name:1}
        ];
        this.edge=[
            {a:0,b:1},
        ];
        while(this.node.length<n){
            let sump=0;
            for(var i=0;i<this.node.length;i++){
                sump=sump+this.getdegree(i);
            }
            //构造概率数组，选择连接节点
            let pArray=[];
            let p=0;
            for(var i=0;i<this.node.length;i++){
                p=p+this.getdegree(i)/sump;
                pArray.push(p);
            }
            let createp=Math.random();
            for(var i=0;i<this.node.length;i++){
                if(createp>=pArray[i]&&createp<pArray[i+1]){
                    this.node.push({id:this.node.length,name:this.node.length});
                    this.edge.push({a:this.node.length-1,b:i});
                }
            }
        }
        this.setxy();
        this.graph();
    }
	//创建最近零耦合网络
    createLOH(n,k){
        this.node=[];
        for(var i=0;i<n;i++){
            this.node.push({id:i,name:i});
        }
        this.edge=[];
        for(var i=0;i<n;i++){
            for(var j=1;j<k+1;j++){
                this.edge.push({a:i,b:(i+j<n)?i+j:i+j-n});
            }
        }
        this.setxy();
        this.graph();
    }
    //创建小世界网络
    createWS(n,k,p){
        this.createLOH(n,k);
        for(var i=0;i<this.edge.length;i++){
            if(Math.random()<p){
                //记录连接的节点
                let close=[];
                for(var j=0;j<this.edge.length;j++){
                    //重新遍历边
                    if(this.edge[j].a==this.edge[i].a){
                        //记录中不存在
                        if(close.indexOf(this.edge[j].b)==-1){
                            close.push(this.edge[j].b);
                        }
                    }
                    if(this.edge[j].b==this.edge[i].a){
                        //记录中不存在
                        if(close.indexOf(this.edge[j].a)==-1){
                            close.push(this.edge[j].a);
                        }
                    }
                }
                //生成未连接的点组
                let open=[];
                for(var j=0;j<this.node.length;j++){
                    if(close.indexOf(j)==-1){
                        open.push(j);
                    }
                }
                this.edge[i].b=open[parseInt(open.length*Math.random())];
            }
        }
        this.setxy();
        this.graph();
    }
    //初始布局
    initgraph(force){
        if(force==undefined){force=false}
        if(this.initgraphtype=="圆环"){
            let r=(Math.min(this.w,this.h)-50)/2;
            for(var i=0;i<this.node.length;i++){
                if(this.node[i].x==undefined||force==true){
                    this.node[i].x=this.w/2+r*Math.cos(2*Math.PI/this.node.length*i);
                }
                if(this.node[i].y==undefined||force==true){
                    this.node[i].y=this.h/2+r*Math.sin(2*Math.PI/this.node.length*i);
                }
            }
        }else if(this.initgraphtype=="随机"){
            for(var i=0;i<this.node.length;i++){
                if(this.node[i].x==undefined||force==true){
                    this.node[i].x=this.w/2+400*(-0.5+Math.random());
                }
                if(this.node[i].y==undefined||force==true){
                    this.node[i].y=this.h/2+400*(-0.5+Math.random());
                }
            }
        }
        this.graph();
    }
    //更新样式
    css(bgcolor){
        this.bgcolor=bgcolor;
    }
    //随机设置节点位置
    setxy(){
        for(var i=0;i<this.node.length;i++){
            this.initgraph(this.initgraphtype=="圆环"?true:false);
            if(this.node[i].dx==undefined){
                this.node[i].dx=0;
            }
            if(this.node[i].dy==undefined){
                this.node[i].dy=0;
            }
            if(this.node[i].c==undefined){
                this.node[i].c=this.nodecolor;
            }
            this.node[i].d=this.getdegree(i);
            //this.node[i].name=this.node[i].d;
        }
    }
    //添加点
    addnode(name,c){
        let id=this.node.length;
        if(name==undefined||name==""){
            var name=id;
        }
        if(c==undefined||c==""){
            var c='#aaaaaa';
        }
        this.node.push({id:id,name:name,c:c});
        this.setxy();
        this.graph();
    }
    //添加边
    addedge(a,b){
        let check=true;
        if(a>this.node.length-1){check=false;}
        if(b>this.node.length-1){check=false;}
        if(a==b){
            check=false;
        }
        for(var i=0;i<this.edge.length;i++){
            if((this.edge[i].a==a&&this.edge[i].b==b)||(this.edge[i].a==b&&this.edge[i].b==a)){
                check=false;
            }
        }
        if(check==true){
            this.edge.push({a:a,b:b});
        }
    }
    //开始布局
    startlayer(){
        this.timer=window.setInterval(()=>{
            this.updata();
            this.graph();
        },1000/this.frame)
    }
    //绘制图形
    graph(){
        //清屏
        this.c.fillStyle=this.bgcolor;
        this.c.fillRect(0,0,this.w,this.h);
        //绘制边
        for(var i=0;i<this.edge.length;i++){
            if(this.edge[i].c==undefined){
                this.c.strokeStyle = this.edgecolor; 
            }else{
                this.c.strokeStyle = this.edge[i].c; 
            }
            this.c.lineWidth=this.edgesize;
            this.c.beginPath();
            this.c.moveTo(this.node[this.edge[i].a].x,this.node[this.edge[i].a].y);
            this.c.lineTo(this.node[this.edge[i].b].x,this.node[this.edge[i].b].y);
            this.c.stroke();
        }
        //绘制节点
        for(var i=0;i<this.node.length;i++){
            this.c.beginPath();
            this.c.fillStyle=this.node[i].c;
            this.c.strokeStyle = "#ffffff";
            this.c.arc(this.node[i].x,this.node[i].y,this.nodesize,0,360);
            this.c.fill();
            this.c.stroke();
        }
        //绘制节点名称
        if(this.nodenamedisplay==true){
            for(var i=0;i<this.node.length;i++){
                if(this.node[i].name!=undefined){
                    this.c.font="10px 微软雅黑";
                    this.c.fillStyle = "#000000";
                    this.c.textAlign = "center";  
                    this.c.fillText(this.node[i].name,this.node[i].x,this.node[i].y+this.nodesize/2);
                }
            }
        }
        //绘制标签
        for(var i=0;i<this.node.length;i++){
            if(this.node[i].label!=undefined){
                this.c.font="8px 微软雅黑";
                this.c.fillStyle = "#ffff00";
                this.c.textAlign = "center";  
                this.c.fillText(this.node[i].label,this.node[i].x,this.node[i].y-10);
           }
        }
    }
    //使用力导向图更新节点位置
    updata(){
        for(var i=0;i<this.node.length;i++){
            if(i!=this.id){
                this.node[i].dx=(this.node[i].dx+this.froce(i).x/this.frame)/this.zx;
                this.node[i].dy=(this.node[i].dy+this.froce(i).y/this.frame)/this.zx;
                this.node[i].x=this.node[i].x-this.node[i].dx;
                this.node[i].y=this.node[i].y-this.node[i].dy;
            }
            
        }
    }
    //计算两点之间距离的平方
    distance(a,b){
        let dx = Math.abs(this.node[a].x - this.node[b].x);
        let dy = Math.abs(this.node[a].y - this.node[b].y);
        let dis2 = Math.pow(dx,2)+Math.pow(dy,2);
        return dis2;
    }
    //计算id节点的合力
    froce(id){
        //计算斥力
        let af={x:0,y:0};
        for(var i=0;i<this.node.length;i++){
            if(i!=id){
                af.x=af.x+(this.node[i].x-this.node[id].x)/this.distance(i,id)*this.af;
                af.y=af.y+(this.node[i].y-this.node[id].y)/this.distance(i,id)*this.af;
            }
        }
        //计算拉力
        let bf={x:0,y:0};
        for(var i=0;i<this.edge.length;i++){
            if(this.edge[i].a==id){
                bf.x=bf.x+(this.node[this.edge[i].a].x-this.node[this.edge[i].b].x)*this.distance(this.edge[i].a,this.edge[i].b)/this.bf;
                bf.y=bf.y+(this.node[this.edge[i].a].y-this.node[this.edge[i].b].y)*this.distance(this.edge[i].a,this.edge[i].b)/this.bf;
            }
            if(this.edge[i].b==id){
                bf.x=bf.x-(this.node[this.edge[i].a].x-this.node[this.edge[i].b].x)*this.distance(this.edge[i].a,this.edge[i].b)/this.bf;
                bf.y=bf.y-(this.node[this.edge[i].a].y-this.node[this.edge[i].b].y)*this.distance(this.edge[i].a,this.edge[i].b)/this.bf;
            }
            
        }
        //计算中心力
        let cf={x:0,y:0};
        cf.x=(this.node[id].x-this.w/2)*this.cf;
        cf.y=(this.node[id].y-this.h/2)*this.cf;
        //返回合力
        let hf={x:0,y:0}
        hf.x=af.x+af.x+bf.x+cf.x
        hf.y=af.y+af.y+bf.y+cf.y;
        //限制值
        if(hf.x==NaN||hf.x==Infinity||Math.abs(hf.x)>100){hf.x=Math.min(Math.max(-10,hf.x),10)}
        if(hf.y==NaN||hf.y==Infinity||Math.abs(hf.y)>100){hf.y=Math.min(Math.max(-10,hf.y),10)}
        return hf;
    }
    //点击获得节点id
    getnode(x,y){
        for(var i =0;i<this.node.length;i++){
            if(Math.abs(this.node[i].x-x)<5&&Math.abs(this.node[i].y-y)<5){
                return i;
            }
        }
        return undefined;
    }
    clearlabel(){
        for(var i=0;i<this.node.length;i++){
            this.node[i].label="";
        }
    }
    //获得节点的度
    getdegree(id){
        let num=0;
        for(var i=0;i<this.edge.length;i++){
            if(this.edge[i].a==id||this.edge[i].b==id){
                num=num+1;
            }
        }
        return num;
    }
    //获得节点分布
    DegreeDistribution(){
        let s=[];
        for(var i=0;i<this.node.length;i++){
            if(s[this.getdegree(i)]==undefined){
                for(var j=s.length;j<this.getdegree(i)+1;j++){
                    s.push(0);
                }
                s[this.getdegree(i)]=s[this.getdegree(i)]+1;
            }else{
                s[this.getdegree(i)]=s[this.getdegree(i)]+1;
            }
        }
        return s;
    }
    //显示度
    showdegree(){
        for(var i=0;i<this.node.length;i++){
            this.node[i].label=this.getdegree(i);
        }
    }
    //获得到节点i不同距离的列表
    getNodePathList(id){
        let group=this.check();
        let znet=[];
        for(var i=0;i<group.length;i++){
            if(group[i].indexOf(id)>-1){
                znet=group[i];
            }
        }
        //使用Dijkstra算法
        let open=[];
        let close=znet;
        //中间节点集合
        let temp=[];
        let temp1=[];
        //初始节点
        temp.push(id);
        var n=0;
        while(temp.length>0){
            //初始化open close
            open.push(temp);
            for(var i=0;i<temp.length;i++){
                close.splice(close.indexOf(temp[i]),1);
            }
            //遍历所有中间数组
            for(var i=0;i<temp.length;i++){
                //遍历所有边
                for(var j=0;j<this.edge.length;j++){
                    if(temp[i]==this.edge[j].a&&close.indexOf(this.edge[j].b)>-1&&temp1.indexOf(this.edge[j].b)==-1){
                        temp1.push(this.edge[j].b);
                    }
                    if(temp[i]==this.edge[j].b&&close.indexOf(this.edge[j].a)>-1&&temp1.indexOf(this.edge[j].a)==-1){
                        temp1.push(this.edge[j].a);
                    }
                }
            }   
            temp=temp1;
            temp1=[];
        }
        return open;
    }
    //显示距离
    showDistance(id){
        console.log(id);
        for(var i=0;i<this.node.length;i++){
            this.node[i].label="";
        }
        var list=this.getNodePathList(id);
        for(var i=0;i<list.length;i++){
            for(var j=0;j<list[i].length;j++){
                this.node[list[i][j]].label=i;
            }
        }
        this.graph();
    }
    //距离上色
    showDistanceColor(id){
        for(var i=0;i<this.node.length;i++){
            this.node[i].label="";
        }
        var list=this.getNodePathList(id);
        for(var i=0;i<list.length;i++){
            for(var j=0;j<list[i].length;j++){
                this.node[list[i][j]].label=i;
            }
        }
        //上色
        for(var i=0;i<list.length;i++){
            for(var j=0;j<list[i].length;j++){
                let str="rgb("+parseInt(255*i/list.length)+","+parseInt(255*(list.length-i)/list.length)+",0)";
                this.node[list[i][j]].c=str;
            }
        }
        this.graph();
    }
    //获得最短路，Dijkstra算法
    getSPath(a,b){
        //验证是否在一个网络中
        let group=this.check();
        let znet=[];
        let check=false;
        for(var i=0;i<group.length;i++){
            if(group[i].indexOf(a)>-1&&group[i].indexOf(b)>-1){
                check=true;
                znet=group[i];
            }
        }
        //如果在一个网络中
        if(check==true){
            let list=this.getNodePathList(a);
            let length=0;
            for(var i=0;i<list.length;i++){
                if(list[i].indexOf(b)>-1){
                   length=i;
                }
            }
            //构造路径，从终点到起点
            let SPath=[];
            SPath[0]=b;
            
            for(var i=1;i<length;i++){
                    for(var k=0;k<this.edge.length;k++){
                        //如果边的一端在返回组的下一层中，且另一端在路径中
                        if(this.edge[k].a==SPath[i-1]&&list[length-i].indexOf(this.edge[k].b)>-1){
                           
                            SPath[i]=this.edge[k].b;
                            break;
                        }
                        if(this.edge[k].b==SPath[i-1]&&list[length-i].indexOf(this.edge[k].a)>-1){
                            
                            SPath[i]=this.edge[k].a;
                            break;
                        }
                    }
            }
            SPath.push(a);
            return SPath;

        }else{
            return false;
        }
    }
    showSPath(a,b){
        //清空颜色
        for(var i=0;i<this.edge.length;i++){
            this.edge[i].c=undefined;
        }
        let Path=this.getSPath(a,b);
        for(var i=0;i<Path.length;i++){
            for(var j=0;j<this.edge.length;j++){
                if(this.edge[j].a==Path[i]&&this.edge[j].b==Path[i+1]){
                    this.edge[j].c="#ff0000";
                }
                if(this.edge[j].b==Path[i]&&this.edge[j].a==Path[i+1]){
                    this.edge[j].c="#ff0000";
                }
            }
        }
    }
    //计算网络效率
    geteffect(){
        let l=0
        for(var i=0;i<this.node.length;i++){
            for(var j=0;j<this.node.length;j++){
                if(i!=j){
                    let length=undefined;
                    if(this.getSPath(i,j)==false){
                        length=Infinity
                    }else{
                        length=this.getSPath(i,j).length-1;
                    }
                    l=l+1/length;
                }
            }
        }
        l=1/(this.node.length*(this.node.length-1))*l;
        return l;
    }
    //获得聚类系数
    getClustering(id){
        //获得链接的节点
        let nodes=[];
        for(var i=0;i<this.edge.length;i++){
            if(this.edge[i].a==id&&nodes.indexOf(this.edge[i].b)==-1){
                nodes.push(this.edge[i].b);
            }
            if(this.edge[i].b==id&&nodes.indexOf(this.edge[i].a)==-1){
                nodes.push(this.edge[i].a);
            }
        }
        //统计邻居的链接情况
        let count=0;
        for(var i=0;i<this.edge.length;i++){
            if(nodes.indexOf(this.edge[i].a)>-1&&nodes.indexOf(this.edge[i].b)>-1){
                count=count+1;
            }
        }
        let Clustering=0;
        if(nodes.length>1){
            Clustering=2*count/(nodes.length*(nodes.length-1));
        }
        return Clustering;
    }
    showClustering(){
        for(var i=0;i<this.node.length;i++){
            this.node[i].label=this.getClustering(i).toFixed(3);
        }
        this.graph();
    }
    getAvgClustering(){
        let AvgClustering=0;
        for(var i=0;i<this.node.length;i++){
            AvgClustering=AvgClustering+this.getClustering(i);
        }
        AvgClustering=AvgClustering/this.node.length
        return AvgClustering;
    }
    //获得介数
    getbetweenness(id){
        let num=0;
        let snum=0;
        for(var i=0;i<this.node.length;i++){
            for(var j= i+1;j<this.node.length;j++){
                let SPath=this.getSPath(i,j);
                if(SPath.indexOf(id)>-1){
                    num=num+1;
                }
                snum=snum+1;
            }
        }
        return num/snum;
    }
    //显示介数
    showbetweenness(){
        for(var i=0;i<this.node.length;i++){
            this.node[i].label=this.getbetweenness(i).toFixed(3);
        }
        this.graph();
    }
    //检验网络连通性
    check(){
        let group=[];
        //判断是否有边
        if(this.edge.length>0){
            group.push([this.edge[0].a]);
            //遍历所有边
            for(var i =0;i<this.edge.length;i++){
                let aedge=this.edge[i];
                //存在闭环
                if(aedge.a!=aedge.b){
                    let checked=false;
                    //遍历所有组
                    va:for(var j=0;j<group.length;j++){
                        //console.log("第",i,"条边判断第",j,"组");
                        //如果a在第j组中
                        if(group[j].indexOf(aedge.a)>-1&&group[j].indexOf(aedge.b)>-1){
                            //console.log("第",i,"条边",aedge.a,aedge.b,"已记录到第",j,"组");
                            checked=true;
                            break;
                        }else if(group[j].indexOf(aedge.a)>-1){
                            //判断在其他组中是否有b
                            let t=false;
                            for(var k=0;k<group.length;k++){
                                if(j!=k){
                                    if(group[k].indexOf(aedge.b)>-1){
                                        //有的话合并两组
                                        group[j] = group[j].concat(group[k]);
                                        group.splice(k,1);
                                        t=true;
                                        checked=true;
                                        //console.log("第",i,"条边",aedge.a,aedge.b,"使第",j,"组和第",k,"组合并");
                                        break va;
                                    }
                                }
                            }
                            //其他组无该点的话直接添加到该组
                            if(t==false){
                                group[j].push(aedge.b);
                                checked=true;
                                //console.log("第",i,"条边",aedge.a,aedge.b,"记录到第",j,"组");
                                break va;
                            }
                        }else if(group[j].indexOf(aedge.b)>-1){
                            let t=false;
                            for(var k=0;k<group.length;k++){
                                if(j!=k){
                                    if(group[k].indexOf(aedge.a)>-1){
                                        //有的话合并两组
                                        group[j] = group[k].concat(group[j]);
                                        group.splice(k,1);
                                        t=true;
                                        checked=true;
                                        //console.log("第",i,"条边",aedge.a,aedge.b,"使第",j,"组和第",k,"组合并");
                                        break va;
                                    }
                                }
                            }
                            //其他组无该点的话直接添加到该组
                            if(t==false){
                                group[j].push(aedge.a);
                                checked=true;
                                //console.log("第",i,"条边",aedge.a,aedge.b,"记录到第",j,"组");
                                break va;
                            }
                        }else{
                            continue va;
                        }
                    }
                    //如果每组都没有，创建新组
                    if(checked==false){
                        group.push([aedge.a,aedge.b]);
                        //console.log("第",i,"条边",aedge.a,aedge.b,"创建了第",group.length,"组");
                    }
                    
                }else{
                    //console.log("第",i,"条",aedge.a,aedge.b,"边为单点");
                }
            }
        }
        //如果存在未连接网络的单一点
        for(var i =0;i<this.node.length;i++){
            let checked=false;
            for(var j =0;j<group.length;j++){
                if(group[j].indexOf(i)>-1){
                    checked=true;
                }
            }
            if(checked==false){
                group.push([i]);
            }
        }
        return group;
    }
}