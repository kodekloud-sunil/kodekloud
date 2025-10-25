pipeline {
    agent any
    tools {
        nodejs 'nodejs-20'
    }
    environment {
        MONGO_URI = 'mongodb+srv://supercluster.d83jj.mongodb.net/superData'
        MOCHA_CHECKS_API = 'false'
        MONGO_USERNAME = credentials('mongo-username')
        MONGO_PASSWORD = credentials('mongo-password')
        SONAR_HOME = tool 'sonar-scanner'
    }
    stages{
        // stage ('Install Dependencies'){
        //     steps {
        //         sh 'npm install --no-audit'
        //     }
        // }
        // stage ('Dependencies Audit') {
        //     parallel {
        //         stage('default audit') {
        //             steps {
        //                 sh 'npm audit --audit-level=critical'
        //             }
        //         }
        //         stage ('OWASP Audit'){
        //             steps {
        //                 dependencyCheck additionalArguments: '''
        //                     --scan "./"
        //                     --out "./"
        //                     --format "ALL"
        //                     --disableYarnAudit
        //                     --prettyPrint''', odcInstallation: 'dep-check-10'
        //                 dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: false

        //                 publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'dependency-check-jenkins.html', reportName: 'Dependency check HTML Report', reportTitles: '', useWrapperFileDirectly: true])

        //                 junit allowEmptyResults: true, keepProperties: true, testResults: 'dependency-check-junit.xml'
        //             }
        //         }
        //     }
        // }
        // stage ('Run Tests'){
        //     steps {
        //         catchError(buildResult: 'SUCCESS') {
        //             sh 'npm test'
        //         }
        //     }
        // }
        // stage ('Coverage') {
        //     steps {
        //         catchError(buildResult: 'UNSTABLE') {
        //             sh 'npm run coverage'
        //         }
        //         publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code coverage Report', reportTitles: '', useWrapperFileDirectly: true])
        //     }
        // }
        // stage ('SAST - Sonarqube'){
        //     steps {
        //         timeout(time: 60, unit: 'SECONDS') {
        //             withSonarQubeEnv ('sunil-sonar-server') {
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
        stage ('Docker Build'){
            steps {
                sh 'docker build -t sunilpolaki/solar-app:$GIT_COMMIT .'
            }
        }
        stage('TRIVY Scan') {
            steps {
                sh '''
                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity LOW,MEDIUM \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-medium-report.json

                    trivy image sunilpolaki/solar-app:$GIT_COMMIT \
                        --severity HIGH,CRITICAL \
                        --quiet \
                        --exit-code 0 \
                        --format json -o trivy-image-critical-report.json
                '''
            }
            post{
                always{
                    sh '''
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-medium-report.xml trivy-image-medium-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-critical-report.xml trivy-image-critical-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-medium-report.html trivy-image-medium-report.json
                        trivy convert \
                            --format template --template "@/usr/local/share/trivy/templates/html.tpl" \
                            --output trivy-image-critical-report.html trivy-image-critical-report.json
                    '''
                }
            }
        }
        stage('Docker Push'){
            steps {
                withDockerRegistry(credentialsId: 'docker-cred', url: "") {
                    sh 'docker push sunilpolaki/solar-app:$GIT_COMMIT'
                }
            }
        }
        stage('Deploy - AWS EC2') {
            steps {
                sshagent(['ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@65.0.69.86 "
                        if sudo docker ps -a | grep -q 'solar-app'; then
                            echo "Container found. Stopping..."
                            sudo docker stop "solar-app" && sudo docker rm "solar-app"
                            echo "Container stopped and removed."
                        fi

                        sudo docker run --name solar-app \\
                            -e MONGO_URI=$MONGO_URI \\
                            -e MONGO_USERNAME=$MONGO_USERNAME \\
                            -e MONGO_PASSWORD=$MONGO_PASSWORD \\
                            -p 3000:3000 -d sunilpolaki/solar-app:$GIT_COMMIT
                        "
                    '''
                }
            }
        }
    }
    post {
        always {
            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-critical-report.html', reportName: 'Trivy Image Critical Report', reportTitles: '', useWrapperFileDirectly: true])

            publishHTML([allowMissing: true, alwaysLinkToLastBuild: true, icon: '', keepAll: true, reportDir: './', reportFiles: 'trivy-image-medium-report.html', reportName: 'Trivy Image Medium Report', reportTitles: '', useWrapperFileDirectly: true])
        }
    }
}