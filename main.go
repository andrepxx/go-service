package main

import (
	"github.com/andrepxx/go-service/controller"
)

/*
 * The entry point of our program.
 */
func main() {
	cn := controller.CreateController()
	cn.Operate()
}
