package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/andrepxx/go-service/webserver"
	"io/ioutil"
)

/*
 * Constants for the controller.
 */
const (
	CONFIG_PATH = "config/config.json"
)

/*
 * The configuration for the controller.
 */
type configStruct struct {
	WebServer webserver.Config
}

/*
 * A data structure that tells whether an operation was successful or not.
 */
type webResponseStruct struct {
	Success bool
	Reason  string
}

/*
 * The controller for the service.
 */
type controllerStruct struct {
	config configStruct
}

/*
 * The controller interface.
 */
type Controller interface {
	Operate()
}

/*
 * Marshals an object into a JSON representation or an error.
 * Returns the appropriate MIME type and binary representation.
 */
func (this *controllerStruct) createJSON(obj interface{}) (string, []byte) {
	buffer, err := json.MarshalIndent(obj, "", "\t")

	/*
	 * Check if we got an error during marshalling.
	 */
	if err != nil {
		errString := err.Error()
		bufString := bytes.NewBufferString(errString)
		bufBytes := bufString.Bytes()
		return this.config.WebServer.ErrorMime, bufBytes
	} else {
		return "application/json; charset=utf-8", buffer
	}

}

/*
 * Example request handler that performs a NO-OP and succeeds.
 */
func (this *controllerStruct) doNothingHandler(request webserver.HttpRequest) webserver.HttpResponse {

	/*
	 * Indicate success.
	 */
	webResponse := webResponseStruct{
		Success: true,
		Reason:  "",
	}

	mimeType, buffer := this.createJSON(webResponse)

	/*
	 * Create HTTP response.
	 */
	response := webserver.HttpResponse{
		Header: map[string]string{"Content-type": mimeType},
		Body:   buffer,
	}

	return response
}

/*
 * Handles requests that could not be dispatched to other handlers.
 */
func (this *controllerStruct) errorHandler(request webserver.HttpRequest) webserver.HttpResponse {

	/*
	 * Create HTTP response.
	 */
	response := webserver.HttpResponse{
		Header: map[string]string{"Content-type": this.config.WebServer.ErrorMime},
		Body:   bytes.NewBufferString("This CGI call is not implemented.").Bytes(),
	}

	return response
}

/*
 * Dispatch CGI requests to the corresponding CGI handlers.
 */
func (this *controllerStruct) dispatch(request webserver.HttpRequest) webserver.HttpResponse {
	cgi := request.Params["cgi"]
	response := webserver.HttpResponse{}

	/*
	 * Find the right CGI to handle the request.
	 */
	switch cgi {
	case "do-nothing":
		response = this.doNothingHandler(request)
	default:
		response = this.errorHandler(request)
	}

	return response
}

/*
 * Initialize the controller.
 */
func (this *controllerStruct) initialize() error {
	content, err := ioutil.ReadFile(CONFIG_PATH)

	/*
	 * Check if file could be read.
	 */
	if err != nil {
		return fmt.Errorf("Could not open config file: '%s'", CONFIG_PATH)
	} else {
		config := configStruct{}
		err = json.Unmarshal(content, &config)
		this.config = config

		/*
		 * Check if file failed to unmarshal.
		 */
		if err != nil {
			return fmt.Errorf("Could not decode config file: '%s'", CONFIG_PATH)
		} else {
			return nil
		}

	}

}

/*
 * Finalize the controller, freeing allocated ressources.
 */
func (this *controllerStruct) finalize() {
	/* Nothing to do in this example. */
}

/*
 * Main routine of our controller. Performs initialization, then runs the message pump.
 */
func (this *controllerStruct) Operate() {
	err := this.initialize()

	/*
	 * Check if initialization was successful.
	 */
	if err != nil {
		msg := err.Error()
		msgNew := "Initialization failed: " + msg
		fmt.Printf("%s\n", msgNew)
	} else {
		serverCfg := this.config.WebServer
		server := webserver.CreateWebServer(serverCfg)

		/*
		 * Check if we got a web server.
		 */
		if server == nil {
			fmt.Printf("%s\n", "Web server did not enter message loop.")
		} else {
			channels := server.RegisterCgi("/cgi-bin/service")
			server.Run()
			tlsPort := serverCfg.TLSPort
			fmt.Printf("Web interface ready: https://localhost:%s/\n", tlsPort)

			/*
			 * This is the actual message pump.
			 */
			for {
				request := <-channels.Requests
				response := this.dispatch(request)
				channels.Responses <- response
			}

		}

		this.finalize()
	}

}

/*
 * Creates a new controller.
 */
func CreateController() Controller {
	controller := controllerStruct{}
	return &controller
}
