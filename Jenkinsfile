node('tezDeals') {
    
    stage('clone repository') {
        git branch: 'latest', credentialsId: 'gitHub', url: 'https://github.com/themagnit/TDB-Ads.git'
    }
    stage('Test'){
        echo "TEST PASSED" 
    }
    def currentVersion = sh script: 'cat package.json | grep version | head -1 | awk -F: \'{ print $2 }\' | sed \'s/[",]//g\' ' , returnStdout: true
    stage('Build/push') {
        currentVersion = currentVersion.replaceAll("\\s","")
        docker.withRegistry('https://index.docker.io/v1/', 'dockerHub') {   
            def customImage = docker.build("magnit002/tezdeals-ads:${currentVersion}")
            customImage.push()
        }
    }
    stage('deploy-category') {
        kubernetesDeploy(
            configs: 'ads-depl.yaml',
            kubeconfigId: 'k8s',
            enableConfigSubstitution: true
        )           
    }
    
}