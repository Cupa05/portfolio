package com.financial.statistics.exception;

import java.time.OffsetDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = PersonAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public @ResponseBody ErrorResponse handleException(PersonAlreadyExistsException ex) {
        return new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage(), OffsetDateTime.now());
    }
}
