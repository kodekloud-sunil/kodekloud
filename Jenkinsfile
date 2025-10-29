pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = "mongodb+srv://supercluster.d83jj.mongodb.net/superData"
        MONGO_USERNAME = credentials('mongo-username')
        MONGO_PASSWORD = credentials('mongo-password')
        SONAR_HOME = tool 'sonar-scanner'
        GIT_TOKEN = credentials('git-token')
    }
    stages {
        // stage('Installing Dependencies') { //
        //     steps {
        //         sh 'npm install --no-audit'
        //     }
        // }
        // stage('dependencies scanning'){
        //     parallel{
        //         stage('audit'){
        //             steps{
        //                 sh 'npm audit --audit-level=critical || true'
        //             }
        //         }
        //         stage('owasp'){
        //             steps{
        //                 dependencyCheck additionalArguments: '''
        //                     --scan "./"
        //                     --out "./"
        //                     --format "ALL"
        //                     --disableYarnAudit
        //                     --prettyPrint''', odcInstallation: 'dep-check-10'
        //                 dependencyCheckPublisher failedTotalCritical: 6, pattern: 'dependency-check-report.xml', stopBuild: true
                         
        //             }
        //         }

        //     }
        // }
        // stage('unit testing'){
        //     steps{
        //         sh 'npm test'
        //     }
        // }
        // stage('code coverage'){
        //     steps{
        //             catchError(buildResult: 'SUCCESS', message: 'holy shit!!!', stageResult: 'UNSTABLE') {
        //                 sh 'npm run coverage'
        //         }
        //     }
        // }
        // stage('SAST'){
        //     steps{
        //         timeout(time: 60, unit: 'SECONDS') {
        //             withSonarQubeEnv('sunil-sonar-server') {
        //                 sh '''
        //                     $SONAR_HOME/bin/sonar-scanner \
        //                         -Dsonar.projectKey=kodekloud \
        //                         -Dsonar.sources=app.js \
        //                         -Dsonar.javascript.lcov.reportPaths=./coverage/lcov.info \
        //                 '''
        //             }
        //         }
        //         waitForQualityGate abortPipeline: true
        //     }
        // }
        stage('docker build'){
            steps{
                sh 'docker build -t sunilpolaki/solar-app:$GIT_COMMIT .'
            }
        }
        stage('trivy'){
            steps{
                sh '''
                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity LOW,MEDIUM,HIGH \
                        --exit-code 0 \
                        --quiet \
                        --format json -o image-medium-results.json 

                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity CRITICAL \
                        --exit-code 0 \
                        --quiet \
                        --format json -o image-critical-results.json
                '''
            }
            post {
                always {
                    sh '''
                        trivy convert --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output image-medium-results.html image-medium-results.json

                        trivy convert --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output image-critical-results.html image-critical-results.json

                        # Convert to JUnit XML reports
                        trivy convert --format template --template "@/usr/local/share/trivy/templates/junit.tpl" \
                            --output image-medium-results.xml image-medium-results.json

                        trivy convert --format template --template "@/usr/local/share/trivy/templates/junit.tpl" \
                            --output image-critical-results.xml image-critical-results.json
                    '''

                    junit allowEmptyResults: true, testResults: 'image-*.xml'
                }
            }
        }
        stage('docker push'){
            steps{
                withDockerRegistry(credentialsId: 'docker-cred', url: "") {
                    sh 'docker push sunilpolaki/solar-app:$GIT_COMMIT'
                }
            }
        }
        stage('aws'){
            when{
                    branch 'feature*'
                }
            steps{
                script{
                    sshagent(['ssh']) {
                        sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@65.0.69.86 'dgf
                            if sudo docker ps -a | grep -q "solar-app"; then
                                echo "Container found. Stopping..."
                                sudo docker stop solar-app && sudo docker rm solar-app
                                echo "Container stopped and removed."
                            fi

                            echo "Running new container..."
                            sudo docker run --name solar-app \\
                                -e MONGO_URI=${env.MONGO_URI} \\
                                -e MONGO_USERNAME=${env.MONGO_USERNAME} \\
                                -e MONGO_PASSWORD=${env.MONGO_PASSWORD} \\
                                -p 3000:3000 -d sunilpolaki/solar-app:$GIT_COMMIT
                        '
                        """
                    }

                }
            }
        }
        stage("integration testing"){
            when{
                    branch 'feature*'
                }
            steps{
                withAWS(credentials: 'aws2', region: 'ap-south-1') {
                    sh '''
                        bash integration-test-with-ec2.sh
                    '''
                }

            }  
        }
        stage("update image tag"){
            when{
                branch 'PR*'
            }
            steps{
                sh 'git clone -b main https://github.com/kodekloud-sunil/kubernetes.git'
                dir('kubernetes'){
                    sh '''
                        ##### Replace Docker Tag #####
                        git checkout main
                        git checkout -b feature-$BUILD_ID
                        sed -i "s#sunilp.*#sunilpolaki/solar-app:$GIT_COMMIT#g" deployment.yaml
                        cat deployment.yaml


                        ##### Commit and Push to Feature Branch #####
                        git config --global user.email "sunilpolaki4321@gmail.com"
                        git config --global user.name "sunilpolaki"
                        git remote set-url origin https://$GIT_TOKEN@github.com/kodekloud-sunil/kubernetes.git
                        git add .
                        git commit -am "Updated docker image"
                        git push -u origin feature-$BUILD_ID
                    '''
                }
            }
        }
        stage('K8s pull request'){
            when{
                branch 'PR*'
            }
            steps{
                sh """
                    curl -s -o response.json -w "%{http_code}" -X POST \\
                    https://github.com/kodekloud-sunil/kubernetes/pulls \\
                    -H "Accept: application/vnd.github+json" \\
                    -H "Authorization: token ${GIT_TOKEN}" \\
                    -H "Content-Type: application/json" \\
                    -d '{
                        "title": "Updated Docker Image",
                        "body": "Updated docker image in deployment manifest",
                        "head": "feature-${BUILD_ID}",
                        "base": "main",
                        "assignees": ["sunilpolaki"]
                    }'
                """
            }
        }
    }
    post {
        always {
            // Clean up the manifest repository to avoid clone conflicts in subsequent runs.
            script {
                if (fileExists('kubernetes')) {
                    sh 'rm -rf kubernetes'
                }
            }
        }
    }
}